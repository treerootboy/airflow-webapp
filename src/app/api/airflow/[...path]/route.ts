import { NextRequest, NextResponse } from "next/server";

// Proxy handler for Airflow API requests
// This allows us to avoid CORS issues when calling the Airflow API from the browser

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "POST");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "DELETE");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, "PUT");
}

async function handleRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const { path } = await paramsPromise;
    
    // Get the base URL and authorization from headers
    const baseUrl = request.headers.get("X-Airflow-Base-URL");
    const authorization = request.headers.get("Authorization");
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Missing X-Airflow-Base-URL header" },
        { status: 400 }
      );
    }
    
    if (!authorization) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }
    
    // Construct the full Airflow API URL
    const apiPath = path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = `${baseUrl.replace(/\/$/, "")}/api/v1/${apiPath}${searchParams ? `?${searchParams}` : ""}`;
    
    // Prepare headers for the proxied request
    const headers: HeadersInit = {
      "Authorization": authorization,
      "Content-Type": "application/json",
    };
    
    // Check if this is a logs request (needs text/plain accept header)
    if (apiPath.includes("/logs/")) {
      headers["Accept"] = "text/plain";
    }
    
    // Prepare request options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    // Add body for non-GET requests
    if (method !== "GET" && method !== "DELETE") {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }
    
    // Make the proxied request
    const response = await fetch(fullUrl, fetchOptions);
    
    // Get the response content type
    const contentType = response.headers.get("content-type") || "";
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || response.statusText },
        { status: response.status }
      );
    }
    
    // Return the response based on content type
    if (contentType.includes("text/plain") || apiPath.includes("/logs/")) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: { "Content-Type": "text/plain" },
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
