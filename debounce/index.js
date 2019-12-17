//防抖函数简单实现
export const Methods = {
  debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearInterval(timer)
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, delay)
    }
  }
}