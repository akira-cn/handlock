const defaultOptions = {
  focusColor: '#e06555',
  fgColor: '#d6dae5',
  bgColor: '#fff',
  n: 3, //圆点的数量： n x n
  innerRadius: 10,  //圆点的内半径
  outerRadius: 25,  //圆点的外半径，focus 的时候显示
  touchRadius: 35,  //判定touch事件的圆半径
  render: true,
};

function getCanvasPoint(canvas, x, y){
  let rect = canvas.getBoundingClientRect();
  return {
    x: x - rect.left,
    y: y - rect.top,
  };
}

function distance(p1, p2){
  let x = p2.x - p1.x, y = p2.y - p1.y;
  return Math.sqrt(x * x + y * y);
}

//画实心圆
function drawSolidCircle(ctx, color, x, y, r){
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();   
}

//画空心圆
function drawHollowCircle(ctx, color, x, y, r){
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.stroke();
}

//画线段
function drawLine(ctx, color, x1, y1, x2, y2){
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();
}

export default class Recorder{
  constructor(options){
    options = Object.assign({}, defaultOptions, options);

    this.options = options;
    this.path = [];

    if(options.render){
      this.render();
    }
  }
  render(){
    if(this.circleCanvas) return false;

    let options = this.options;
    let container = options.container || document.createElement('div');

    if(!options.container){
      Object.assign(container.style, {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        lineHeight: '100%',
        overflow: 'hidden',
        backgroundColor: options.bgColor
      });
      document.body.appendChild(container); 
    }
    this.container = container;
    
    let {width, height} = container.getBoundingClientRect();

    //画圆的 canvas，也是最外层监听事件的 canvas
    let circleCanvas = document.createElement('canvas'); 
    circleCanvas.width = circleCanvas.height = Math.min(width, height);
    Object.assign(circleCanvas.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    });

    //画固定线条的 canvas
    let lineCanvas = circleCanvas.cloneNode(true);

    //画不固定线条的 canvas
    let moveCanvas = circleCanvas.cloneNode(true);

    container.appendChild(lineCanvas);
    container.appendChild(moveCanvas);
    container.appendChild(circleCanvas);

    this.lineCanvas = lineCanvas;
    this.moveCanvas = moveCanvas;
    this.circleCanvas = circleCanvas;

    this.reset();
    return true;
  }
  reset(){
    if(!this.circleCanvas) this.render();

    let {circleCanvas, lineCanvas, moveCanvas} = this,
        circleCtx = circleCanvas.getContext('2d'),
        lineCtx = lineCanvas.getContext('2d'),
        moveCtx = moveCanvas.getContext('2d'),
        width = circleCanvas.width,
        {n, fgColor, innerRadius} = this.options;

    circleCtx.clearRect(0, 0, width, width);
    lineCtx.clearRect(0, 0, width, width);
    moveCtx.clearRect(0, 0, width, width);

    let range = Math.round(width / (n + 1));

    let circles = [];

    //drawCircleCenters
    for(let i = 1; i <= n; i++){
      for(let j = 1; j <= n; j++){
        let y = range * i, x = range * j;
        drawSolidCircle(circleCtx, fgColor, x, y, innerRadius);
        let circlePoint = {x, y};
        circlePoint.pos = [i, j];
        circles.push(circlePoint);
      }
    }

    this.circles = circles;
  }
  async record({minPoints = 4, resetNow = false} = {}){
    if(this._currentPromise) return this._currentPromise;

    let {circleCanvas, lineCanvas, moveCanvas, options} = this,
        circleCtx = circleCanvas.getContext('2d'),
        lineCtx = lineCanvas.getContext('2d'),
        moveCtx = moveCanvas.getContext('2d');

    if(resetNow) this.reset(); //立即重置
    else{
      circleCanvas.addEventListener('touchstart', ()=>{
        this.reset();
      });
    }

    let records = [];

    let handler = evt => {
      let {clientX, clientY} = evt.changedTouches[0],
          {bgColor, focusColor, innerRadius, outerRadius, touchRadius} = options,
          touchPoint = getCanvasPoint(moveCanvas, clientX, clientY);

      for(let i = 0; i < this.circles.length; i++){
        let point = this.circles[i],
            x0 = point.x,
            y0 = point.y;

        if(distance(point, touchPoint) < touchRadius){
          drawSolidCircle(circleCtx, bgColor, x0, y0, outerRadius);
          drawSolidCircle(circleCtx, focusColor, x0, y0, innerRadius);
          drawHollowCircle(circleCtx, focusColor, x0, y0, outerRadius);

          if(records.length){
            let p2 = records[records.length - 1],
                x1 = p2.x,
                y1 = p2.y;

            drawLine(lineCtx, focusColor, x0, y0, x1, y1);
          }

          let circle = this.circles.splice(i, 1);
          records.push(circle[0]);
          break;
        }
      }

      if(records.length){
        let point = records[records.length - 1],
            x0 = point.x,
            y0 = point.y,
            x1 = touchPoint.x,
            y1 = touchPoint.y;

        moveCtx.clearRect(0, 0, moveCanvas.width, moveCanvas.height);
        drawLine(moveCtx, focusColor, x0, y0, x1, y1);        
      }
    };


    circleCanvas.addEventListener('touchstart', handler);
    circleCanvas.addEventListener('touchmove', handler);

    let promise = new Promise(resolve => {
      let done = evt => {
        moveCtx.clearRect(0, 0, moveCanvas.width, moveCanvas.height);
        if(!records.length) return;

        circleCanvas.removeEventListener('touchstart', handler);
        circleCanvas.removeEventListener('touchmove', handler);
        document.removeEventListener('touchend', done);

        let err = null;

        if(records.length < minPoints){
          err = new Error('not enough points');
        }
        //这里可以选择一些复杂的编码方式，本例子用最简单的直接把坐标转成字符串
        resolve({err, records: records.map(o => o.pos.join('')).join('')});
        this._currentPromise = null;
      };
      document.addEventListener('touchend', done);
    });

    this._currentPromise = promise;

    return promise;
  }
}
