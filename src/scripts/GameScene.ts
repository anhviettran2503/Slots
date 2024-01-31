import * as PIXI from 'pixi.js';
import { MainApp } from './app';
import Server from './Server';

const symbolTextures =[];
const symbolTypes = ['1', '2', '3', '4', '5', '6', '7', '8', 'K'];
const reels = [];
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
        reelContainer.position = new PIXI.Point(0,200);
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
            for (let j = 0; j < 4; j++)
            {
                let randomId=Math.floor(Math.random() * symbolTextures.length);
                if(randomId==0) randomId++;
                const symbol = new PIXI.Sprite(symbolTextures[randomId]);
                // Scale the symbol to fit symbol area.
                console.log("id:"+randomId);
                symbol.y = j * GameScene.SYMBOL_HEIGHT;
                symbol.scale.x = symbol.scale.y = Math.min(GameScene.SYMBOL_HEIGHT / symbol.width, GameScene.SYMBOL_HEIGHT / symbol.height);
                symbol.x = Math.round((GameScene.SYMBOL_HEIGHT - symbol.width) / 2);
                reel.symbols.push(symbol);
                rc.addChild(symbol);
            }
            reels.push(reel);
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
            
        }
    }

    private _startSpin (): void {
        console.log(` >>> start spin`);
        this._server.requestSpinData();
    }

    private _onSpinDataResponded (data: string[]): void {
        console.log(` >>> received: ${data}`);
        /**
         * Received data from server.
         * TODO: should proceed in client here to stop the spin and show result.
         */
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
    
}