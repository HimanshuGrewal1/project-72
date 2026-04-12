const express=require('express');
const cors=require('cors');
const app=express();
app.use(cors());
app.use(express.json());
const dotenv=require('dotenv');
dotenv.config();


const port=process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Working createMap');
});
app.listen(port,()=>{
    console.log(`Gateway is running on port ${port}`);
});
