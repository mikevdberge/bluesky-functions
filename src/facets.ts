import { HandlerEvent } from '@netlify/functions'
import { AppBskyRichtextFacet } from '@atproto/api'

type Facet = AppBskyRichtextFacet.Main

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const handler = async (event: HandlerEvent) => {
//exports.handler = async (event, context) => {

    if (!event.body || event.httpMethod !== 'POST') {
      console.log("Invalid request body: ",event.body);
      console.log("Invald HTTP Method:", event.httpMethod);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({
          status: 'invalid-method'
        })
      }
    }
    
      const data = JSON.parse(event.body)
    
      if (!data.text) {
        console.error('Required information is missing.')
        console.log("Invalid request body: ",event.body);
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
          body: JSON.stringify({
            status: 'missing-information'
          })
        }
      }

    //const subject = event.queryStringParameters.name
    const body = JSON.parse(event.body)

    //get BlueSky facets (JSON) from the provided text
    let facet = detectFacets(body.text);

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({"text": body.text, facet}),
    }
}

function detectFacets(text: string) {
    const facets = [];
    // URL detection regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;
    // Detect URLs
    while ((match = urlRegex.exec(text)) !== null) {
        facets.push({
            index: {
                byteStart: match.index,
                byteEnd: match.index + match[0].length
            },
            features: [{
                    $type: "app.bsky.richtext.facet#link",
                    uri: match[0]
                }]
        });
    }
    // Mention detection regex (handles both @handle and @handle.bsky.social formats)
    const mentionRegex = /@([a-zA-Z0-9.-]+(?:\.[a-zA-Z0-9.-]+)*)/g;
    // Detect mentions
    while ((match = mentionRegex.exec(text)) !== null) {
        const handle = match[1];
        // In a real app, you'd want to validate/resolve the DID
        const temporaryDid = `did:plc:${Buffer.from(handle).toString('hex')}`;
        facets.push({
            index: {
                byteStart: match.index,
                byteEnd: match.index + match[0].length
            },
            features: [{
                    $type: "app.bsky.richtext.facet#mention",
                    did: temporaryDid
                }]
        });
    }
    // Sort facets by start index
    return facets.sort((a, b) => a.index.byteStart - b.index.byteStart);
}

class UnicodeString {
  utf16: string
  utf8: Uint8Array

  constructor(utf16: string) {
    this.utf16 = utf16
    this.utf8 = encoder.encode(utf16)
  }

  // helper to convert utf16 code-unit offsets to utf8 code-unit offsets
  utf16IndexToUtf8Index(i: number) {
    return encoder.encode(this.utf16.slice(0, i)).byteLength
  }
}