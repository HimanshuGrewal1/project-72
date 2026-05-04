// auth-service/index.js
import express from 'express';
import { SiweMessage, generateNonce } from 'siwe';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import cors from "cors"

const app = express();

app.use(cors({
    origin:"http://localhost:5173"
}))

app.use(express.json());



const redisClient = createClient({ url: 'rediss://default:gQAAAAAAASp8AAIncDE0MmJjMjEzY2M2MDk0NzUzYjUzNGEzYmZiNjE1YTRiN3AxNzY0MTI@fleet-joey-76412.upstash.io:6379' });
await redisClient.connect().then(()=>{
    console.log("reddis connected")
}).catch((e)=>{
    console.log(e);
});


const JWT_SECRET = "your_super_secret_key";

// Step 1: Generate a unique nonce and store it in Redis for 5 minutes
app.get('/api/nonce', async (req, res) => {
    const nonce = generateNonce();
    console.log(nonce);
    // Use the user's IP or a temporary ID as a key to associate the nonce
    const tempId = req.ip; 
    await redisClient.setEx(`nonce:${tempId}`, 300, nonce);
    res.send(nonce);
});

// Step 2: Verify the signature
app.post('/api/verify', async (req, res) => {
    try {
        const { message, signature } = req.body;
        const siweMessage = new SiweMessage(message);
        
        const tempId = req.ip;
        const storedNonce = await redisClient.get(`nonce:${tempId}`);

        // Validate the signature and the nonce
        const { data } = await siweMessage.verify({ 
            signature, 
            nonce: storedNonce 
        });

        if (!data) return res.status(401).json({ message: "Invalid signature" });

        // Clean up nonce after successful use
        await redisClient.del(`nonce:${tempId}`);

        // Create JWT for the user session
        const token = jwt.sign({ address: data.address }, JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ token, address: data.address });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});




app.listen(3001, () => console.log("Auth Service running on 3001"));