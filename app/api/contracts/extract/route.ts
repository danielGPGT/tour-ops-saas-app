import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { processPDF } from '@/lib/pdf-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function extractWithGPT4(pdfData: { content: string; type: 'pdf' | 'text' }): Promise<any> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const prompt = `You are an expert contract analyst specializing in hotel and travel industry contracts. 

Analyze this contract document thoroughly and extract ALL relevant information. Look for:
- Contract dates, terms, and conditions
- Room types, rates, and occupancy details
- Payment schedules and billing instructions
- Cancellation policies and penalties
- Contact information for both parties
- Special terms, surcharges, and additional fees
- Check-in/check-out procedures
- Attrition and wash policies
- Any other important contractual details

Return ONLY valid JSON with this structure:

{
  "supplier_name": "string - Hotel/supplier name",
  "supplier_contact": {
    "name": "string - Contact person name",
    "title": "string - Job title",
    "phone": "string - Phone number",
    "email": "string - Email address",
    "address": "string - Physical address"
  },
  "client_name": "string - Client/company name",
  "client_contact": {
    "name": "string - Contact person name",
    "title": "string - Job title", 
    "phone": "string - Phone number",
    "email": "string - Email address",
    "address": "string - Physical address"
  },
  "contract_number": "string - Contract reference number",
  "contract_name": "string - Contract title/event name",
  "contract_type": "string - allocation, purchase, net_rate, etc.",
  "event_dates": {
    "start_date": "YYYY-MM-DD - Event start date",
    "end_date": "YYYY-MM-DD - Event end date",
    "check_in": "YYYY-MM-DD - Check-in date",
    "check_out": "YYYY-MM-DD - Check-out date"
  },
  "contract_dates": {
    "valid_from": "YYYY-MM-DD - Contract start date",
    "valid_to": "YYYY-MM-DD - Contract end date",
    "signature_deadline": "YYYY-MM-DD - When contract must be signed"
  },
  "currency": "string - USD, SGD, EUR, etc.",
  "total_value": "number - Total contract value",
  "payment_terms": "string - Payment terms description",
  "billing_instructions": "string - How payments should be made",
  "cancellation_policy": "string - Cancellation policy",
  "attrition_policy": "string - Attrition and wash policy details",
  "commission_rate": "number - Commission percentage",
  "service_charge": "number - Service charge percentage",
  "tax_rate": "number - Tax rate percentage",
  "room_requirements": [
    {
      "room_type": "string - Room type name",
      "base_rate": "number - Base rate per night",
      "surcharge": "number - Additional surcharge if any",
      "total_rate": "number - Total rate including surcharges",
      "quantity": "number - Number of rooms",
      "nights": "number - Number of nights",
      "dates": "string - Specific dates for this rate",
      "occupancy": "string - Single/Double occupancy",
      "includes": "string - What's included (breakfast, internet, etc.)"
    }
  ],
  "payment_schedule": [
    {
      "payment_number": "number - Payment sequence",
      "due_date": "YYYY-MM-DD - Due date",
      "amount": "number - Payment amount",
      "percentage": "number - Percentage of total",
      "description": "string - Payment description"
    }
  ],
  "release_schedule": [
    {
      "release_date": "YYYY-MM-DD - Release date",
      "release_percentage": "number - Percentage to release",
      "penalty_applies": "boolean - Whether penalty applies",
      "notes": "string - Release notes"
    }
  ],
  "special_terms": [
    "string - Any special terms or conditions"
  ],
  "check_in_out": {
    "check_in_time": "string - Check-in time",
    "check_out_time": "string - Check-out time",
    "early_arrival": "string - Early arrival policy",
    "late_checkout": "string - Late checkout policy"
  },
  "additional_services": [
    {
      "service": "string - Service name",
      "rate": "number - Service rate",
      "description": "string - Service description"
    }
  ]
}

EXTRACTION GUIDELINES:
- Extract ALL dates mentioned in the contract
- Look for room rates, surcharges, and total costs
- Find payment schedules and due dates
- Identify cancellation and attrition policies
- Extract contact information for both parties
- Look for special terms and conditions
- Find check-in/check-out times and policies
- Identify any additional services or fees
- Extract room requirements and occupancy details
- Look for wash dates and release schedules

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown code blocks, no other text
- Use null for fields you cannot find
- Extract dates in YYYY-MM-DD format
- Extract numbers as actual numbers, not strings
- Be thorough - extract as much information as possible
- If you see multiple room types, create multiple room_requirements entries
- If you see payment milestones, create payment_schedule entries
- If you see release dates, create release_schedule entries
- Extract contact information for both supplier and client
- Look for special terms, surcharges, and additional fees

CRITICAL: Return ONLY the JSON object, no markdown code blocks, no explanations, no other text.
DO NOT wrap the JSON in markdown code blocks.
DO NOT include markdown formatting at the beginning or end.
Return ONLY the raw JSON object.

Be comprehensive and extract all available information from the contract.`

  try {
    console.log('🤖 CALLING GPT-4 API...')
    console.log('📄 PDF type:', pdfData.type)
    console.log('🔑 OpenAI API Key configured:', !!process.env.OPENAI_API_KEY)
    console.log('📝 Prompt length:', prompt.length)
    console.log('📄 PDF content length:', pdfData.content.length)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: pdfData.type === 'text' 
            ? [
                { type: "text", text: prompt },
                { type: "text", text: `Please analyze this contract text:\n\n${pdfData.content}` }
              ]
            : [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: pdfData.content,
                    detail: "high"
                  }
                }
              ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    })
    
    console.log('📡 GPT-4 API RESPONSE RECEIVED!')
    console.log('📊 Response choices count:', response.choices?.length || 0)
    console.log('📊 Response usage:', response.usage)

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.error('No content in GPT-4 response:', response)
      throw new Error('No content returned from GPT-4')
    }

    console.log('📄 GPT-4 CONTENT LENGTH:', content.length)
    console.log('📄 GPT-4 CONTENT PREVIEW:', content.substring(0, 500))

    // Parse the JSON response - handle markdown code blocks
    let extracted
    try {
      // Remove markdown code blocks if present
      let jsonContent = content.trim()
      console.log('📄 ORIGINAL CONTENT:', jsonContent)
      
      // More robust markdown removal
      if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.replace(/```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.replace(/```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Also remove any leading/trailing whitespace and newlines
      jsonContent = jsonContent.trim()
      
      console.log('📄 CLEANED JSON CONTENT:', jsonContent.substring(0, 200) + '...')
      
      extracted = JSON.parse(jsonContent)
      console.log('✅ SUCCESSFULLY PARSED JSON FROM GPT-4!')
      console.log('📋 PARSED DATA KEYS:', Object.keys(extracted))
      console.log('🏨 PARSED SUPPLIER:', extracted.supplier_name)
      console.log('📄 PARSED CONTRACT:', extracted.contract_number)
      console.log('💰 PARSED VALUE:', extracted.total_value)
    } catch (parseError) {
      console.error('❌ JSON PARSING FAILED!')
      console.error('🚨 Parse error:', parseError)
      console.error('📄 Raw content that failed to parse:', content)
      throw new Error(`Failed to parse JSON from GPT-4: ${parseError}`)
    }

    return extracted

  } catch (error) {
    console.error('❌ GPT-4 API CALL FAILED!')
    console.error('🚨 Error details:', error)
    throw new Error(`Failed to extract contract data with AI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function matchToExisting(extracted: any) {
  const supabase = await createClient()
  
  // Match supplier
  if (extracted.supplier_name) {
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, name')
      .ilike('name', `%${extracted.supplier_name}%`)
      .limit(1)
    
    if (suppliers && suppliers.length > 0) {
      extracted.supplier_id = suppliers[0].id
      console.log(`✅ Matched supplier: ${suppliers[0].name}`)
    } else {
      console.log(`❌ No supplier match found for: ${extracted.supplier_name}`)
    }
  }

  // Match products for allocations
  if (extracted.allocations && Array.isArray(extracted.allocations)) {
    for (const allocation of extracted.allocations) {
      if (allocation.product_name) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .ilike('name', `%${allocation.product_name}%`)
          .limit(1)
        
        if (products && products.length > 0) {
          allocation.product_id = products[0].id
          console.log(`✅ Matched product: ${products[0].name}`)
        } else {
          console.log(`❌ No product match found for: ${allocation.product_name}`)
        }
      }
    }
  }

  return extracted
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 PDF EXTRACTION API CALLED')
    
    // Get user ID from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }
    
    const userId = authHeader.replace('Bearer ', '')
    console.log('👤 User ID:', userId)

    // Get organization for user
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('🏢 Organization ID:', userData.organization_id)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📄 File received:', file.name, file.type, file.size)

    // Process the file
    const pdfData = await processPDF(file)
    console.log('📄 Processed file type:', pdfData.type)

    // Extract data with GPT-4
    console.log('🔍 EXTRACTING DATA WITH GPT-4...')
    let extracted
    let aiSuccess = false
    
    try {
      console.log('🚀 CALLING GPT-4 API...')
      extracted = await extractWithGPT4(pdfData)
      console.log('✅ GPT-4 EXTRACTION SUCCESS!')
      console.log('📋 Extracted data keys:', Object.keys(extracted))
      console.log('🏨 Supplier name:', extracted.supplier_name)
      console.log('📄 Contract number:', extracted.contract_number)
      aiSuccess = true
    } catch (aiError) {
      console.error('❌ GPT-4 EXTRACTION FAILED!')
      console.error('🚨 Error details:', aiError)
      console.log('🔄 USING FALLBACK DATA...')
      aiSuccess = false
      
      // Fallback to mock data if AI fails
      extracted = {
        supplier_name: "Grand Hotel Dubai",
        contract_number: "GH-DXB-2024-001", 
        contract_name: "Hotel Allocation Agreement",
        contract_type: "allocation",
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
        currency: "AED",
        total_value: 500000,
        payment_terms: "30 days net",
        cancellation_policy: "48 hours notice required",
        commission_rate: 10,
        allocations: [
          {
            product_name: "Deluxe Room",
            quantity: 50,
            nights: 1,
            total_cost: 250000,
            notes: "High season allocation"
          }
        ],
        payment_schedule: [
          {
            payment_number: 1,
            due_date: "2024-02-01",
            amount: 100000,
            percentage: 20,
            description: "Initial payment"
          }
        ],
        release_schedule: [
          {
            release_date: "2024-06-01",
            release_percentage: 25,
            penalty_applies: true,
            notes: "First release"
          }
        ]
      }
    }

    // Match to existing suppliers and products
    console.log('🔍 MATCHING TO EXISTING DATA...')
    const matchedData = await matchToExisting(extracted)

    // Prepare response
    const result = {
      success: true,
      confidence: aiSuccess ? 85 : 0,
      extracted: matchedData,
      warnings: aiSuccess ? [] : ['AI extraction failed, using fallback data'],
      document_url: `/uploads/contracts/${file.name}`,
      document_name: file.name,
      ai_success: aiSuccess
    }

    console.log('✅ EXTRACTION COMPLETE!')
    console.log('📊 Data source:', aiSuccess ? 'AI' : 'FALLBACK')
    console.log('📋 Final extracted object:', JSON.stringify(result.extracted, null, 2))

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ PDF EXTRACTION API ERROR:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to extract contract data', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}