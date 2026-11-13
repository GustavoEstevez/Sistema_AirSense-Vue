import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'

// Content stays visible when motion, observers or the animation API are unavailable.
export function useScrollReveal(root, routeKey) {
  const seen = new WeakSet()
  const pending = new Set()
  const animations = new Set()
  let observer
  let motionQuery
  let disposed = false

  function reveal(element, animate = true) {
    if (!pending.delete(element)) return
    observer?.unobserve(element)
    seen.add(element)
    element.classList.remove('entrance-pending')
    if (!animate || motionQuery.matches) return
    const animation = element.animate([
      { opacity: 0, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], {
      duration: 700,
      delay: Math.min(200, Math.max(0, Number(element.dataset.entrance) || 0)),
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'backwards',
    })
    animations.add(animation)
    animation.onfinish = animation.oncancel = () => animations.delete(animation)
  }

  function clear() {
    observer?.disconnect()
    for (const element of pending) element.classList.remove('entrance-pending')
    pending.clear()
    for (const animation of animations) animation.cancel()
    animations.clear()
  }

  function setup() {
    clear()
    if (disposed || !root.value || motionQuery.matches ||
        !('IntersectionObserver' in window) || !Element.prototype.animate) return
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target)
      }
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' })
    for (const element of root.value.querySelectorAll('[data-entrance]')) {
      if (seen.has(element) || element.contains(document.activeElement)) continue
      pending.add(element)
      element.classList.add('entrance-pending')
      observer.observe(element)
    }
  }

  function onMotionChange() {
    if (motionQuery.matches) clear()
  }

  function onFocus(event) {
    for (const element of [...pending]) {
      if (element.contains(event.target)) reveal(element, false)
    }
    // A focused control must be immediately visible, even during its entrance.
    for (const animation of animations) {
      if (animation.effect?.target?.contains(event.target)) animation.cancel()
    }
  }

  onMounted(() => {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', onMotionChange)
    root.value?.addEventListener('focusin', onFocus)
    setup()
  })
  watch(routeKey, async () => {
    await nextTick()
    if (!disposed && motionQuery) setup()
  })
  onBeforeUnmount(() => {
    disposed = true
    clear()
    root.value?.removeEventListener('focusin', onFocus)
    motionQuery?.removeEventListener('change', onMotionChange)
  })
}
