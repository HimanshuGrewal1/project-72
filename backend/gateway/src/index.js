const express=require('express');
const cors=require('cors');
const app=express();
app.use(cors());
app.use(express.json());
const dotenv=require('dotenv');
dotenv.config();
 const proxy = require('express-http-proxy');

const port=process.env.PORT || 3000;

app.use('/auth', proxy('http://localhost:8001'));
app.use('/create-map', proxy('http://localhost:8002'));
app.use('/crud-map', proxy('http://localhost:8003'));

app.get('/', (req, res) => {
    res.send('Working');
});
app.listen(port,()=>{
    console.log(`Gateway is running on port ${port}`);
});
