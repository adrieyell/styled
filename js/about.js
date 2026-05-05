// ============================================
// ABOUT PAGE - Iframe detection
// ============================================

if (window !== window.top) {
  document.body.classList.add("in-iframe");
}
