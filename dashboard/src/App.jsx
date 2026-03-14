import Dashboard from './components/Dashboard';

function App() {
  return (
    <div style={{  
    backgroundColor: '#121212', 
    color: 'black', 
    padding: '40px', 
    display: 'flex',        
    justifyContent: 'center',
    alignItems: 'center',
    width:'200vh'
}}>
  <Dashboard />
</div>
  );
}

export default App;