document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('sample-button')

  if (button) {
    button.addEventListener('click', function () {
      alert('Button clicked! This JavaScript was inlined successfully.')

      // Change button text to indicate it was clicked
      this.textContent = 'Clicked!'
      this.style.backgroundColor = '#28a745'
    })
  }
})
