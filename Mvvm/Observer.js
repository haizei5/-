//观察者-观察数据是否更新
class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    //先把旧值保存起来
    this.oldValue = this.getOldValue()
  }
  //获取旧值  
  getOldValue() {
    Dep.target = this; //挂在观察者
    const oldValue = compileUtil.getVal(this.expr, this.vm);
    Dep.target = null;
    return oldValue
  }
  //获取新值
  update() {
    const newValue = compileUtil.getVal(this.expr, this.vm);
    if (newValue != this.oldValue) {
      this.cb(newValue);
    }
  }
}
//收集依赖
class Dep {
  constructor() {
    this.subs = [];
  }
  //收集观察者
  addSub(watcher) {
    this.subs.push(watcher)
  }
  //通知观察者
  notify() {
    console.log("观察者", this.subs);
    this.subs.forEach(w => {
      w.update()
    })
  }
}

//劫持监听数据属性
class Observer {
  constructor(data) {
    this.observe(data);
  }
  observe(data) {
    //只对对象做处理
    if (data && typeof data === "object") {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key]);
      })
    }
  }
  defineReactive(obj, key, value) {
    //递归遍历
    this.observe(value);
    const dep = new Dep();
    //劫持并监听所有属性
    Object.defineProperty(obj, key, {
      enumerable: true,//对象属性是否可通过for-in循环，flase为不可循环，默认值为true
      configurable: false,//能否使用delete、能否需改属性特性、或能否修改访问器属性、，false为不可重新定义，默认值为true
      get() {
        //添加订阅变化时,往Dep中添加观察者
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set: (newVal) => {
        this.observe(newVal);//检测最新的数据，并实施更新
        if (newVal !== value) {
          value = newVal
        }
        //告诉Dep通知变化
        dep.notify();
      }
    })
  }
}