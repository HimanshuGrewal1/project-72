import mongoose from 'mongoose';
import neo4j from 'neo4j-driver';
import {GoogleGenerativeAI}  from '@google/generative-ai';
import express from 'express';
import { User } from '../modals/user.js';
import { Project } from '../modals/project.js';
import { DocumentChunk } from '../modals/chunk.js';


// Gemini Setup
const genAI = new GoogleGenerativeAI("AIzaSyCbRaRjbIuGfrBMMYbNdok0BqpXHw4n_bQ");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });


// Neo4j Setup (Graph Database)
const neo4jDriver = neo4j.driver(
  "neo4j+s://2acd29ec.databases.neo4j.io",
  neo4j.auth.basic("2acd29ec", "bRj2C2VhMWTZM9TwaTFqFFwyoPqB6To9pZK6ewk-xsQ")
);

// MongoDB Connection
await mongoose.connect("mongodb+srv://princeraj1504_db_user:Prince%401504@cluster0.ymknu7u.mongodb.net/test?retryWrites=true&w=majority").then(()=>{
  console.log("connected to mongoose");
}).catch((e)=>{
  console.log("cannot connect to mongoose" , e);
});



//  CORE LOGIC: GRAPH EXTRACTION WITH GEMINI

// Prompts Gemini to turn plain text into Nodes and Edges
async function extractGraphData(text) {
  const prompt = `
    Analyze the following text and extract a knowledge graph.
    Identify key entities (people, concepts, technologies, places) and the relationships between them.
    Return ONLY a valid JSON object with this exact structure:
    {
      "nodes": [{"id": "UniqueEntityName", "type": "Person|Concept|Organization", "description": "Short description"}],
      "edges": [{"source": "EntityName1", "target": "EntityName2", "relation": "WORKS_WITH|PART_OF|USES", "description": "How they relate"}]
    }
    Text: ${text}
  `;

  //Groq
  // const completion = await groq.chat.completions.create({
  //   messages: [{ role: "user", content: prompt }],
  //   model: "llama-3.1-8b-instant",
  //   response_format: { type: "json_object" }
  // });
  
  // return JSON.parse(completion.choices[0].message.content);

  //Gemni
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" } // Forces pure JSON output
  });
  return JSON.parse(result.response.text());
  
}

// Stores extracted graph into Neo4j with Logical Isolation (projectId)
async function storeGraphInNeo4j(graphData, projectId) {
  const session = neo4jDriver.session();
  console.log("Storing graph in Neo4j with projectId:", projectId);
  try {
    // 1. Merge Nodes (Tagging with projectId for logical isolation)
    for (const node of graphData.nodes) {
      await session.run(`
        MERGE (n:Entity {id: $id, projectId: $projectId})
        ON CREATE SET n.type = $type, n.description = $description
        ON MATCH SET n.type = $type, n.description = $description
      `, { 
        id: node.id.toUpperCase(), 
        projectId, 
        type: node.type, 
        description: node.description 
      });
    }

    // 2. Merge Edges (Tagging relations with projectId)
    for (const edge of graphData.edges) {
      // Dynamic relationship types require APOC or specific query structuring. 
      // For simplicity and safety, we use a generic 'RELATED_TO' and store the specific relation as a property.
      await session.run(`
        MATCH (source:Entity {id: $sourceId, projectId: $projectId})
        MATCH (target:Entity {id: $targetId, projectId: $projectId})
        MERGE (source)-[r:RELATED_TO {projectId: $projectId, relation: $relation}]->(target)
        ON CREATE SET r.description = $description
      `, {
        sourceId: edge.source.toUpperCase(),
        targetId: edge.target.toUpperCase(),
        projectId,
        relation: edge.relation.toUpperCase().replace(/\s+/g, '_'),
        description: edge.description
      });
    }
  }catch(e){
    console.error("Error storing graph in Neo4j:", e);
  } finally {
    await session.close();
  }
}



const router = express.Router();

// Create Project
router.post('/', async (req, res) => {
  const project = await Project.create({ ownerId: req.body.ownerId, name: req.body.name });
  res.json(project);
});


//Get All Projects for a User
router.get('/user/:ownerId', async (req, res) => {
  const projects = await Project.find({ ownerId: req.params.ownerId });
  // console.log("Fetched projects for ownerId:", req.params.ownerId, "Projects:", projects);
  return res.json(projects);
});


// 1. GENERATE METADATA (Stateless - No Database Saving)
router.post('/llm/generate-metadata', async (req, res) => {
  const { textChunk } = req.body; 

  try {
    // 1. Extract Graph
    const graphData = await extractGraphData(textChunk);
    console.log("Extracted graph data for chunk:", graphData);
    
    // 2. Generate Embedding
    // const embeddingValues = await getLocalEmbedding(textChunk);
    //gemini
    const embedResult = await embeddingModel.embedContent(textChunk);


    // console.log("Generated embedding for chunk. Length:", embedResult);
    // Return the raw data to the frontend so it can be encrypted
    return res.json({
      graph: graphData,

      //gemini
      embedding: embedResult.embedding.values
      //local embedding
      // embedding: embeddingValues
    });
  } catch (error) {
    console.error("Error in /llm/generate-metadata:", error);
    return res.status(500).json(error);
  }
});

// 2. STORE ENCRYPTED DATA (The Blind Vault)
router.post('/:id/store-secure', async (req, res) => {
  const { id: projectId } = req.params;
  const { encryptedChunks, cid, litHash} = req.body;

  try {
    await Project.findByIdAndUpdate(projectId, { status: 'processing' });

    console.log(encryptedChunks);
    let allNodes = [];
    let allEdges = [];

    // 1. Store Encrypted Chunks in MongoDB
    for (const chunk of encryptedChunks) {
      console.log("Storing encrypted chunk with Lit hash:", chunk);
      await DocumentChunk.create({
        projectId,
        encryptedText: chunk.ciphertext, // The unreadable string
        litHash: chunk.dataToEncryptHash,
        acc: chunk.acc,
        embedding: chunk.embedding       // The searchable vector
      });

      if (chunk.graph) {
        allNodes.push(...chunk.graph.nodes);
        allEdges.push(...chunk.graph.edges);
      }

    }

    // 2. Store Graph in Neo4j 
    // (Note: To be strictly E2EE, the 'description' strings in graphNodes 
    // should also be encrypted by the frontend before sending here).
    if (allNodes.length > 0) {
      await storeGraphInNeo4j({ nodes: allNodes, edges: allEdges }, projectId);
    }

    await Project.findByIdAndUpdate(projectId, { status: 'processed' });
    return res.json({ message: "Secure Knowledge Graph stored successfully." });

  } catch (error) {
    console.error(error);
    await Project.findByIdAndUpdate(projectId, { status: 'failed' });
    return res.status(500).json({ error: "Secure storage failed" });
  }
});



// Process Parsed Text into Graph and Vector DB
// router.post('/:id/process', async (req, res) => {
//   const { id: projectId } = req.params;
//   const { text } = req.body; // The parsed PDF text from your frontend

  
//   try {
//       await Project.findByIdAndUpdate(projectId, { status: 'processing' });
//     // 1. Graph Extraction Pipeline
//     const graphData = await extractGraphData(text);
//     console.log("Extracted Graph Data:", graphData);
//     const res = await storeGraphInNeo4j(graphData, projectId);
//     console.log("Graph stored in Neo4j :", res);

//     // 2. Normal RAG Pipeline (Chunking and Embeddings)
//     // Simple naive chunking (for production, use recursive character splitting)
//     const chunks = text.match(/.{1,1000}(\s|$)/g) || [text]; 
    
//     for (const chunkText of chunks) {
//       const embedResult = await embeddingModel.embedContent(chunkText);
//       await DocumentChunk.create({
//         projectId,
//         text: chunkText,
//         embedding: embedResult.embedding.values
//       });
//     }

//     await Project.findByIdAndUpdate(projectId, { status: 'processed' });
//     res.json({ message: "Knowledge Graph and Vectors generated successfully." });

//   } catch (error) {
//     console.error(error);
//     await Project.findByIdAndUpdate(projectId, { status: 'failed' });
//     res.status(500).json({ error: "Processing failed" });
//   }
// });

// Fetch Graph for Frontend Visualization (e.g., using react-force-graph)
router.get('/:id/graph', async (req, res) => {
  const { id: projectId } = req.params;
  
  const session = neo4jDriver.session();
  try {
      // Strict logical isolation: only fetch where projectId matches
      console.log("Fetching graph from Neo4j for projectId:", projectId);
    const result = await session.run(`
      MATCH (n:Entity {projectId: $projectId})
      OPTIONAL MATCH (n)-[r:RELATED_TO {projectId: $projectId}]->(m:Entity {projectId: $projectId})
      RETURN n, r, m
    `, { projectId });
        console.log("Raw Neo4j Result:", result.records, "records");
    const nodesMap = new Map();
    const links = [];

    result.records.forEach(record => {
      const n = record.get('n').properties;
      if (!nodesMap.has(n.id)) nodesMap.set(n.id, { id: n.id, name: n.id, group: n.type });

      if (record.get('m')) {
        const m = record.get('m').properties;
        const r = record.get('r').properties;
        if (!nodesMap.has(m.id)) nodesMap.set(m.id, { id: m.id, name: m.id, group: m.type });
        
        links.push({
          source: n.id,
          target: m.id,
          label: r.relation
        });
      }
    });

    return res.json({
      nodes: Array.from(nodesMap.values()),
      links: links
    });
  } catch(err){
    console.log("Error fetching graph from Neo4j:", err);
    return res.status(500).json({ error: "Failed to fetch graph" });
  }finally {
    await session.close();
  }
});

// Normal RAG Query Endpoint
router.post('/:id/query-secure', async (req, res) => {
  const { id: projectId } = req.params;
  const { query } = req.body;

  try {
    // 1. Embed the query (Embeddings are public vectors, so this is fine)
    const queryEmbedding = (await embeddingModel.embedContent(query)).embedding.values;
    console.log("Query embedding generated. Length:", queryEmbedding.length,query);
    // 2. Vector Search in MongoDB
    // We fetch the 'encryptedText', 'litHash', and 'acc' instead of 'text'
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index", 
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 10,
          limit: 4, // Top 4 most relevant chunks
          filter: { projectId: projectId }
        }
      },
      {
        $project: {
          encryptedText: 1,
          litHash: 1,
          acc: 1,
          _id: 0
        }
      }
    ];
    
    const relevantEncryptedChunks = await DocumentChunk.aggregate(pipeline);
    console.log("Relevant encrypted chunks fetched for query:", relevantEncryptedChunks);
    // Return the "Locked Boxes" to the frontend
    res.json({ encryptedContext: relevantEncryptedChunks });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
