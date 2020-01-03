const compileUtil = {
  //处理person.name情况
  getVal(expr, vm) {

    //[person,name]
    return expr.split('.').reduce((data, currentVal) => {
      return data[currentVal];
    }, vm.$data)
  },
  //设置值
  setVal(expr, vm, inputVal) {
    //[person,name]
    return expr.split('.').reduce((data, currentVal) => {
      data[currentVal] = inputVal;
    }, vm.$data)
  },
  getContentVal(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm)
    })
  },
  text(node, expr, vm) {
    let value;
    if (expr.indexOf("{{") !== -1) {
      //{{person.name}}--{{person.age}}
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        //绑定观察者，将来数据发生变化，触发这里的回调，进行更新
        new Watcher(vm, args[1], (newVal) => {
          console.log(newVal);
          this.updater.textUpdater(node, this.getContentVal(expr, vm))
        })
        return this.getVal(args[1], vm)
      })
    } else {
      value = this.getVal(expr, vm);
    }
    this.updater.textUpdater(node, value);
  },
  html(node, expr, vm) {
    const value = this.getVal(expr, vm);
    new Watcher(vm, expr, (newVal) => {
      this.updater.htmlUpdater(node, newVal)
    })
    this.updater.htmlUpdater(node, value);
  },
  model(node, expr, vm) {
    const value = this.getVal(expr, vm);
    //绑定更新函数 数据驱动=>视图
    new Watcher(vm, expr, (newVal) => {
      console.log(newVal);
      this.updater.modeUpdater(node, newVal)
    })
    //视图=>数据=>视图
    node.addEventListener('input', (e) => {
      // 设置值
      this.setVal(expr, vm, e.target.value);
    })
    this.updater.modeUpdater(node, value);
  },
  on(node, expr, vm, eventName) {
    console.log(vm);
    let fn = vm.$option.methods && vm.$option.methods[expr];
    node.addEventListener(eventName, fn.bind(vm), false);
  },
  //更新对象
  updater: {
    textUpdater(node, value) {
      node.textContent = value
    },
    htmlUpdater(node, value) {
      node.innerHTML = value
    },
    modeUpdater(node, value) {
      node.value = value
    }
  }
}
class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);//判断是否获取节点对象
    this.vm = vm;
    //1.获取文档碎片对象 放入内存中会减少页面的回流和重绘 
    const fragment = this.node2Fragment(this.el);
    //2.编译模板
    this.compile(fragment);
    //3.追加子元素到根元素
    this.el.appendChild(fragment);
  }
  compile(fragment) {
    //1.获取子节点
    const childNodes = fragment.childNodes;
    [...childNodes].forEach(child => {
      //  console.log(child);
      if (this.isElementNode(child)) {
        //是元素节点
        //编译元素节点
        this.compileElement(child)
      } else {
        //文本节点
        //编译文本节点
        this.compileText(child)
      }

      //递归遍历所有节点
      if (child.childNodes && child.childNodes.length) {
        this.compile(child)
      }
    })
  }
  isEventName(attrName) {
    return attrName.startsWith("@");//事件是否以@开头
  }
  isDirective(attrName) {
    return attrName.startsWith("v-");//是否以v-开头
  }
  //编译元素
  compileElement(node) {
    const attribute = node.attributes;
    [...attribute].forEach(attr => {
      console.log(attr);
      const { name, value } = attr
      if (this.isDirective(name)) {//是一个指令 v-text v-html v-model v-on:click
        const [, directive] = name.split('-') //text html model click
        const [dirName, eventName] = directive.split(":");
        //更新数据 数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName)
        //删除有指令的标签上的属性
        node.removeAttribute('v-' + directive)
      } else if (this.isEventName(name)) {
        let [, eventName] = name.split("@");
        compileUtil['on'](node, value, this.vm, eventName)
      }
    })
  }
  //编译文本
  compileText(node) {
    //{{}} v-text
    const content = node.textContent;
    if (/^\{\{(.+?)\}\}$/.test(content)) {
      compileUtil['text'](node, content, this.vm)
    }

  }
  node2Fragment(node) {
    //创建文档碎片对象
    console.log(node);
    const f = document.createDocumentFragment();
    let firstChild;
    while (firstChild = node.firstChild) {
      f.appendChild(firstChild)
    }
    return f;

    const childNodes = node.childNodes;
  }
  isElementNode(node) {
    return node.nodeType === 1;
  }
}




class MVue {
  constructor(options) {
    console.log(options);
    this.$el = options.el;
    this.$data = options.data;
    this.$option = options;
    if (this.$el) {
      //1.实现一个数据观察者
      new Observer(this.$data)
      //2.实现一个指令解析器
      new Compile(this.$el, this)
      this.proxyData(this.$data);
    } else {
      throw new Error("DOM节点未定义")
    }
  }
  proxyData(data) {
    for (const key in data) {
      Object.defineProperty(this.key, {
        get() {
          return data[key];
        },
        set(newVal) {
          data[key] = newVal;
        }
      })
    }
  }
}

