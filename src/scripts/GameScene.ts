    import * as PIXI from 'pixi.js';
    import { MainApp } from './app';
    import Server from './Server';

    const symbolTextures =[];
    const symbolTypes = ['1', '2', '3', '4', '5', '6', '7', '8', 'K'];
    export class GameScene extends PIXI.Container {
        constructor (server: Server) {
            super();

            /**
             * Register spin data responded event handler
             */
            this._server = server;
            this._server.registerDataRespondEvent(this._onSpinDataResponded.bind(this));

            /**
             * Added onUpdate function to PIXI Ticker so it will be called every frame
             */
            MainApp.inst.app.ticker.add(this.onUpdate, this);
            /**
             * Ask PIXI Loader to load needed resources
             */
            MainApp.inst.app.loader
            .add('logo', 'images/logo.png')
            .add('symbol_1', 'images/symbol_1.png')
            .add('symbol_2', 'images/symbol_2.png')
            .add('symbol_3', 'images/symbol_3.png')
            .add('symbol_4', 'images/symbol_4.png')
            .add('symbol_5', 'images/symbol_5.png')
            .add('symbol_6', 'images/symbol_6.png')
            .add('symbol_7', 'images/symbol_7.png')
            .add('symbol_8', 'images/symbol_8.png')
            .add('symbol_K', 'images/symbol_K.png')
            .load(this._onAssetsLoaded.bind(this));
        }

        static readonly NUMBER_OF_REELS = 5;
        static readonly NUMBER_OF_ROWS = 3;
        static readonly SYMBOL_WIDTH = 140;
        static readonly SYMBOL_HEIGHT = 150;

        private _server: Server;

        private _isInitialized: boolean = false;
        private _logoSprite: PIXI.Sprite;
        private _spinText: PIXI.Text;
        private factorY=200;
        private reelDelayTime=300;
        private results=[];
        private running:boolean;
        private startSpinTime: Date;
        private reels = [];
        private tweening = [];
        private minTimeReel=2000;
        public init (): void {

            this.addChild(this._logoSprite);
            this._logoSprite.position.set(720 / 2, 100);
            this._logoSprite.anchor.set(0.5);
            this._logoSprite.scale.set(0.5);

            const style = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 36,
                fontWeight: 'bold',
                fill: ['#ffffff', '#00ff99'], // gradient
                stroke: '#4a1850',
                strokeThickness: 5,
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 4,
                dropShadowAngle: Math.PI / 6,
                dropShadowDistance: 6,
                wordWrap: true,
                wordWrapWidth: 440,
            });
            
            this._spinText = new PIXI.Text('Start Spin', style);
            this._spinText.x = 720 / 2 - this._spinText.width / 2;
            this._spinText.y = MainApp.inst.app.screen.height - 100 + Math.round((100 - this._spinText.height) / 2);
            this.addChild(this._spinText);
            /**
             * Enable interactive so we can click on this text
             */
            this._spinText.interactive = true;
            this._spinText.buttonMode = true;
            this._spinText.addListener('pointerdown', this._startSpin.bind(this));

            this._isInitialized = true;
            const reelContainer = new PIXI.Container();
            reelContainer.position = new PIXI.Point(0,this.factorY);
            for (let i = 0; i < 5; i++)
            {
                const rc = new PIXI.Container();

                rc.x = i * GameScene.SYMBOL_WIDTH;
                reelContainer.addChild(rc);

                const reel = {
                    container: rc,
                    symbols: [],
                    position: 0,
                    previousPosition: 0,
                    blur: new PIXI.filters.BlurFilter(),
                };

                reel.blur.blurX = 0;
                reel.blur.blurY = 0;
                rc.filters = [reel.blur];

                // Build the symbols
                for (let j = 0; j < 3; j++)
                {
                    let randomId=Math.floor(Math.random() * symbolTextures.length);
                    if(randomId==0) randomId++;
                    const symbol = new PIXI.Sprite(symbolTextures[randomId]);
                    // Scale the symbol to fit symbol area.
                    symbol.y = j * GameScene.SYMBOL_HEIGHT;
                    symbol.scale.x = symbol.scale.y = Math.min(GameScene.SYMBOL_HEIGHT / symbol.width, GameScene.SYMBOL_HEIGHT / symbol.height);
                    symbol.x = Math.round((GameScene.SYMBOL_HEIGHT - symbol.width) / 2);
                    reel.symbols.push(symbol);
                    rc.addChild(symbol);
                }
                this.reels.push(reel);
            }
            this.addChild(reelContainer);
        }

        public onUpdate (dtScalar: number) {
            const dt = dtScalar / PIXI.settings.TARGET_FPMS / 1000;
            if (this._isInitialized) {
                /**
                 * Update objects in scene here using dt (delta time)
                 * TODO: should call all update function of all the objects in Scene
                 */
                this._logoSprite.rotation += dt;
                this.UpdateForTween();
                this.HandleReelsPosition(); 
            }
        }
        private UpdateForTween():void{
            const now = Date.now();
            const remove = [];
            for (let i = 0; i < this.tweening.length; i++)
            {
                const t = this.tweening[i];
                const phase = Math.min(1, (now - t.start) / t.time);

                t.object[t.property] = this.lerp(t.propertyBeginValue, t.target, t.easing(phase));
                if (t.change) t.change(t);
                if (phase === 1)
                {
                    t.object[t.property] = t.target;
                    if (t.complete) t.complete(t);
                    remove.push(t);
                }
            }
            for (let i = 0; i < remove.length; i++)
            {
                this.tweening.splice(this.tweening.indexOf(remove[i]), 1);
            }
        }
        private HandleReelsPosition():void{
           for (let i = 0; i < this.reels.length; i++)
           {
            const r = this.reels[i];
                    // Update blur filter y amount based on speed.
                    // This would be better if calculated with time in mind also. Now blur depends on frame rate.

            r.blur.blurY = (r.position - r.previousPosition) * 8;
            r.previousPosition = r.position;

                    // Update symbol positions on reel.
            for (let j = 0; j < r.symbols.length; j++)
            {
                const s = r.symbols[j];
                const prevy = s.y;

                s.y = ((r.position + j) % r.symbols.length) * GameScene.SYMBOL_HEIGHT-GameScene.SYMBOL_HEIGHT;
                if (s.y < 0 && prevy > GameScene.SYMBOL_HEIGHT)
                {

                    if(this.results.length==0)
                    {
                        let randomId=Math.floor(Math.random() * symbolTextures.length);
                        if(randomId==0) randomId++;
                        s.texture = symbolTextures[randomId];
                    }
                    else
                    {
                     const index=i*r.symbols.length+j;
                     if(s.texture!=symbolTextures[this.results[index]])
                     {
                        console.log('done:'+i+'-'+j+' '+this.results[index]);
                        s.texture=symbolTextures[this.results[index]];
                     }
                    }
                    s.scale.x = s.scale.y = Math.min(GameScene.SYMBOL_HEIGHT / s.texture.width, GameScene.SYMBOL_HEIGHT / s.texture.height);
                    s.x = Math.round((GameScene.SYMBOL_HEIGHT - s.width) / 2);
                }
     }
 }
}
private _startSpin (): void {
    console.log(` >>> start spin`);
    this.running = true;
    this.startSpinTime = new Date(Date.now());
    this._server.requestSpinData();

    for (let i = 0; i < this.reels.length; i++)
    {
        setTimeout(()=>{
           const r = this.reels[i];
           const extra = Math.floor(Math.random() * 3);
           const target = r.position + 10 + i * 5 + extra;
           const time = 2500 + i * 600 + extra * 600;
             // console.log(i+' '+time);
           if(this.running)
               this.tweenTo(r, 'position', target, time, this.backout(0.5), null, null);
       },i*this.reelDelayTime)
    }

}

private _onSpinDataResponded (data: string[]): void {
    console.log(` >>> received: ${data}`);
    data=['1', '2', '3', '4', '5', '6', '7', '8', 'K','1', '2', '3', '4', '5', '6'];
    this.results=data;
      console.log('_onSpinDataResponded results.length:'+this.results.length);
    const currentTime: number = Date.now();
    let elapsedTime: number = currentTime - this.startSpinTime.getTime();

    let delay=0;
    if(elapsedTime<this.minTimeReel)
        delay=this.minTimeReel-elapsedTime;
    console.log('elapsedTime: '+elapsedTime+' delay: '+delay);
    setTimeout(()=>{
            //this.ShowResults(data);
        this.running=false;
        this.tweening.forEach((item)=>{
                // console.log(item.time);
            item.time=Math.min(item.time,3000);
        });
    },delay);   
}
private ShowResults(data: string[]):void{
    for (let i = 0; i < this.reels.length; i++)
    {
      const r = this.reels[i];
      for (let j = 0; j < r.symbols.length; j++)
      {
        const s = r.symbols[j];
        const index=i*r.symbols.length+j;
        s.texture=symbolTextures[data[index]];
        s.scale.x = s.scale.y = Math.min(GameScene.SYMBOL_HEIGHT / s.texture.width, GameScene.SYMBOL_HEIGHT / s.texture.height);
        s.x = Math.round((GameScene.SYMBOL_HEIGHT - s.width) / 2);
    }
}
}
private _onAssetsLoaded (loaderInstance: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>): void {
            /**
             * After loading process is finished this function will be called
             */
    this._logoSprite = new PIXI.Sprite(resources['logo'].texture);
    symbolTypes.forEach((type) => {
        symbolTextures[type] = resources[`symbol_${type}`].texture;
    });
    this.init();
}

private tweenTo(object, property, target, time, easing, onchange, oncomplete)
{
    const tween = {
        object,
        property,
        propertyBeginValue: object[property],
        target,
        easing,
        time,
        change: onchange,
        complete: oncomplete,
        start: Date.now(),
    };

    this.tweening.push(tween);

    return tween;
}
private lerp(a1, a2, t)
{
    return a1 * (1 - t) + a2 * t;
}
private backout(amount)
{
    return (t) => (--t * t * ((amount + 1) * t + amount) + 1);
}
}