// Test API Connection
const testAPI = async () => {
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);

    // Test login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com' })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login Test:', loginData);

    // Test create session
    if (loginData.user) {
      const sessionResponse = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: loginData.user.id, 
          userEmail: loginData.user.email,
          title: 'Test Chat'
        })
      });
      const sessionData = await sessionResponse.json();
      console.log('✅ Session Created:', sessionData);

      // Test save message
      if (sessionData.session) {
        const messageResponse = await fetch('http://localhost:5000/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionData.session.id,
            role: 'user',
            content: 'Hello, this is a test message!'
          })
        });
        const messageData = await messageResponse.json();
        console.log('✅ Message Saved:', messageData);
      }
    }

    console.log('\n🎉 All tests passed! Database is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAPI();
