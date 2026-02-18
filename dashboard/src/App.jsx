import Dashboard from './components/Dashboard';

function App() {
  return (
    <div style={{  
    backgroundColor: '#121212', 
    color: 'white', 
    padding: '40px', 
    display: 'flex',        
    justifyContent: 'center',
    alignItems: 'center',
    width:'275%'
}}>
  <Dashboard />
</div>
  );
}

export default App;