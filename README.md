# 手势密码设置和解锁的实现

这是[第三届360前端星计划](http://html5.360.cn/star)的[在线作业](doc/handlock.md)的参考实现。

## 在线例子

[在线示例](http://handlock.test.h5jun.com/example/locker.html)

![扫描二维码](https://p.ssl.qhimg.com/t0183f30bf0e1670466.png)

## 安装和使用

直接在浏览器里引用:

```html
<script src="https://s2.ssl.qhres.com/!9f2db498/HandLock-0.2.1.min.js"></script>
```

## API

### Locker

创建一个可以设置密码和验证密码的实例

```js
var password = '11121323';

var locker = new HandLock.Locker({
  container: document.querySelector('#handlock'),
  check: {
    checked: function(res){
      if(res.err){
        console.error(res.err); //密码错误或长度太短
      }else{
        console.log(`正确，密码是：${res.records}`);
      }
    },
  },
  update:{
    beforeRepeat: function(res){
      if(res.err){
        console.error(res.err); //密码长度太短
      }else{
        console.log(`密码初次输入完成，等待重复输入`);
      }
    },
    afterRepeat: function(res){
      if(res.err){
        console.error(res.err); //密码长度太短或者两次密码输入不一致
      }else{
        console.log(`密码更新完成，新密码是：${res.records}`);
      }
    },
  }
});

locker.check(password);
```

### 几种 err 状态

- ERR_NOT_ENOUGH_POINTS 绘制的点数量不足，默认为最少4个点
- ERR_PASSWORD_MISMATCH 密码不一致，check时密码不对或者update时两次输入密码不一致
- ERR_USER_CANCELED     用户切换验证或设置操作时，取消当前的状态

### 可配置的参数

```js
//recorder.js
const defaultOptions = {
  container: null, //创建canvas的容器，如果不填，自动在 body 上创建覆盖全屏的层
  focusColor: '#e06555',  //当前选中的圆的颜色
  fgColor: '#d6dae5',     //未选中的圆的颜色
  bgColor: '#fff',        //canvas背景颜色
  n: 3, //圆点的数量： n x n
  innerRadius: 10,  //圆点的内半径
  outerRadius: 25,  //圆点的外半径，focus 的时候显示
  touchRadius: 35,  //判定touch事件的圆半径
  render: true,     //自动渲染
  customStyle: false, //自定义样式
  minPoints: 4,     //最小允许的点数
};
```

```js
//locker.js
const defaultOptions = {
  update: {
    beforeRepeat: function(){}, //更新密码第一次输入后的事件
    afterRepeat: function(){}   //更新密码重复输入后的事件
  },
  check: {
    checked: function(){} //校验密码之后的事件
  }
}
```

### clearPath()

清除 canvas 上选中的圆。

### cancel()

取消当前状态，用于update/check状态切换。

## 修改和发布代码

下载仓库并安装依赖：

```bash
npm install
```

启动服务：

```bash
npm start
```

发布代码：

```bash
npm run deploy
```

## License

MIT
