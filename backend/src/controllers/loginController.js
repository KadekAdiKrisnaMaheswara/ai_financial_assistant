const handleLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    })

    // simpan token
    localStorage.setItem('token', response.data.token)

    // redirect ke dashboard
    navigate('/dashboard')

  } catch (error) {
    console.log(error)
  }
}