import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import UploadPDF from './UploadPDF';
import { useParams } from 'react-router-dom';

const GraphView = () => {
  const { id } = useParams();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const fgRef = useRef();

  useEffect(() => {
    console.log("Fetching graph for projectId:", id);
    const fetchGraph = async () => {
      try {
        // setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/projects/${id}/graph`);
        console.log(res);
        setGraphData(res.data);
      } catch (err) {
        console.error("Error fetching graph:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchGraph();
  }, [id]);

  // Optional: Auto-focus the graph once it loads
  const handleEngineStop = () => {
    fgRef.current.zoomToFit(1000);
  };

  if (loading) return <div>Generating Knowledge Map...</div>;

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', background: '#f9f9f9' }}>
      <h3 style={{ padding: '10px' }}>Project Knowledge Graph</h3>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        height={500}
        nodeLabel="id" // Show name on hover
        nodeAutoColorBy="group" // Color nodes by their Type (Concept, Person, etc.)
        linkDirectionalParticles={2} // Moving dots on lines to show relationship flow
        linkDirectionalParticleSpeed={0.005}
        linkLabel="label" // Show relationship type (e.g., "WORKS_WITH") on hover
        onEngineStop={handleEngineStop}
        
        // Custom styling for Nodes
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          
          // Draw Circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Draw Text Label
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'black';
          ctx.fillText(label, node.x, node.y + 8);
        }}
      />
      <UploadPDF projectId={id} />

    </div>
  );
};

export default GraphView;