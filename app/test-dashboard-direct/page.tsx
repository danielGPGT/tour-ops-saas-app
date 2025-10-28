export default function TestDashboardDirect() {
  return (
    <html>
      <body>
        <h1>DIRECT DASHBOARD TEST</h1>
        <p>This bypasses all layouts and components</p>
        <p>Time: {new Date().toISOString()}</p>
        <p>If you see this, Next.js routing works completely</p>
        
        <div>
          <h2>The Issue Is:</h2>
          <ul>
            <li>❌ Dashboard layout problem</li>
            <li>❌ AppSidebar hanging in layout</li>
            <li>❌ Browser cache issue</li>
          </ul>
        </div>
        
        <a href="/" style={{color: 'blue'}}>← Back to Dashboard</a>
      </body>
    </html>
  )
}
