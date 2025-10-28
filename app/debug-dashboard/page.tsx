export default function DebugDashboard() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚀 MINIMAL DASHBOARD TEST</h1>
      <p>Time: {new Date().toISOString()}</p>
      
      <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
        <h2>Navigation Test</h2>
        <a href="/test-simple" style={{ color: 'blue', textDecoration: 'underline' }}>
          → Test Simple Page (known working)
        </a>
        <br />
        <a href="/events" style={{ color: 'blue', textDecoration: 'underline' }}>
          → Events Page
        </a>
        <br />
        <a href="/products" style={{ color: 'blue', textDecoration: 'underline' }}>
          → Products Page  
        </a>
      </div>
      
      <div style={{ border: '1px solid green', padding: '10px', backgroundColor: '#f0f8f0' }}>
        <h3>✅ This Should Load Instantly</h3>
        <p>If you see this, Next.js routing works fine.</p>
        <p>The issue is with the main dashboard imports/components.</p>
      </div>
      
      <div style={{ border: '1px solid red', padding: '10px', backgroundColor: '#fff0f0' }}>
        <h3>❌ If This Still Hangs...</h3>
        <p>Then the problem is deeper - middleware or server level.</p>
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          console.log('🎯 Debug dashboard loaded at:', new Date().toISOString());
          console.log('🌐 Current URL:', window.location.href);
          console.log('📱 User agent:', navigator.userAgent);
        `
      }} />
    </div>
  );
}
