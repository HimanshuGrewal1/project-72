// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import CreateProject from './CreateProject.jsx';
import GraphView from './components/GraphView.jsx';
import Signup from './components/Signup.jsx';
import PassLogin from './components/PassLogin.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PassLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-project" element={<CreateProject />} />
        {/* You will build this page yourself, so we just route it to a placeholder */}
        <Route path="/project/:id" element={<GraphView/>} />
      </Routes>
    </Router>
  );
}