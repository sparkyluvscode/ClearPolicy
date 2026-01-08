import { NextRequest, NextResponse } from "next/server";
import { congress } from "@/lib/clients/congress";
import { openstates } from "@/lib/clients/openstates";
import { generateSummary } from "@/lib/ai";
import { z } from "zod";

const Params = z.object({ id: z.string(), source: z.enum(["os", "congress"]) });

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const source = req.nextUrl.searchParams.get("source");
  const parsed = Params.safeParse({ id, source });
  if (!parsed.success) return NextResponse.json({ error: "missing params" }, { status: 400 });

  if (parsed.data.source === "os") {
    const data = await openstates.billById(parsed.data.id).catch(() => null);
    if (!data) {
      return NextResponse.json({ kind: "prop", jurisdiction: "CA", raw: null, error: "openstates unavailable" });
    }
    // Handle both {results: [...]} and direct object responses
    let billData: any = data;
    if (data) {
      // Check if data has a results array
      if (data.results) {
        if (Array.isArray(data.results)) {
          if (data.results.length > 0) {
            billData = data.results[0];
          } else {
            // Empty results array - bill not found in OpenStates
            return NextResponse.json({ kind: "prop", jurisdiction: "CA", raw: null, error: "bill not found" });
          }
        } else if (typeof data.results === "object" && !Array.isArray(data.results)) {
          billData = data.results;
        }
      }
      // If data itself looks like a bill (has id, title, or identifier), use it directly
      else if (data.id || data.title || data.identifier) {
        billData = data;
      }
    }
    
    // Validate we have actual bill data
    if (!billData || (Array.isArray(billData) && billData.length === 0)) {
      return NextResponse.json({ kind: "prop", jurisdiction: "CA", raw: null, error: "bill data invalid" });
    }
    
    // Additional validation - check if billData has at least some identifying information
    if (!billData.id && !billData.title && !billData.identifier && !billData.extras && !billData.latest_action_description) {
      return NextResponse.json({ kind: "prop", jurisdiction: "CA", raw: null, error: "bill data incomplete" });
    }
    
    // Enhance with AI-generated summary if we have enough content
    let aiSummary = null;
    if (billData && process.env.GEMINI_API_KEY) {
      try {
        const title = billData.title || billData.identifier || "";
        // Collect ALL available content for better AI analysis
        const content = [
          billData.extras?.impact_clause,
          billData.latest_action_description,
          billData.abstracts?.[0]?.abstract,
          billData.summary,
          title,
          // Include classification and subjects as context
          Array.isArray(billData.classification) ? billData.classification.join(", ") : "",
          Array.isArray(billData.subject) ? billData.subject.join(", ") : (billData.subject || ""),
        ].filter(Boolean).join(". ");
        
        const subjects = Array.isArray(billData.subject) ? billData.subject : (billData.subject ? [billData.subject] : []);
        
        if (content.length > 20) {
          aiSummary = await generateSummary({
            title,
            content,
            subjects,
            identifier: billData.identifier,
            type: "bill",
          });
        }
      } catch (error) {
        console.error("AI summary generation failed for bill:", error);
        // Continue without AI summary
      }
    }
    
    return NextResponse.json({ 
      kind: "prop", 
      jurisdiction: "CA", 
      raw: billData,
      aiSummary, // Include AI summary if available
    });
  }
  if (parsed.data.source === "congress") {
    const [congressNum, billType, billNumber] = parsed.data.id.split(":");
    const data = await congress.billDetail(congressNum, billType, billNumber).catch(() => null);
    if (!data) return NextResponse.json({ kind: "bill", jurisdiction: "US", raw: null, error: "congress.gov unavailable" });
    
    // Enhance with AI-generated summary if we have enough content
    let aiSummary = null;
    if (data?.bill && process.env.GEMINI_API_KEY) {
      try {
        const bill = data.bill;
        const title = bill.title || bill.number || "";
        // Collect ALL available content for better AI analysis
        const content = [
          bill.summaries?.[0]?.text,
          bill.summaries?.[1]?.text, // Include multiple summaries if available
          bill.latestAction?.text,
          bill.title,
          // Include subjects as context
          (bill.subjects || []).map((s: any) => s?.name || "").filter(Boolean).join(", "),
        ].filter(Boolean).join(". ");
        
        const subjects = (bill.subjects || []).map((s: any) => s?.name || "").filter(Boolean);
        
        if (content.length > 20) {
          aiSummary = await generateSummary({
            title,
            content,
            subjects,
            identifier: bill.number,
            type: "bill",
          });
        }
      } catch (error) {
        console.error("AI summary generation failed for federal bill:", error);
        // Continue without AI summary
      }
    }
    
    return NextResponse.json({ 
      kind: "bill", 
      jurisdiction: "US", 
      raw: data,
      aiSummary, // Include AI summary if available
    });
  }
  return NextResponse.json({ error: "bad source" }, { status: 400 });
}


