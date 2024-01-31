import * as PIXI from 'pixi.js';
import { MainApp } from './app';
import Server from './Server';

const symbolTextures = {
    // '1' : null,
    // '2' : null,
    // '3' : null,
    // '4' : null,
    // '5' : null,
    // '6' : null,
    // '7' : null,
    // '8' : null,
    // 'K' : null
};

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

        /**
         * DEMO: Temporary show a default board table
         * TODO: we should split board table to small objects and initialize/manage them
         */
        const boardContainer = this.addChild(new PIXI.Container());
        boardContainer.position = new PIXI.Point(720 / 2, 960 / 2 + 100);
        const boardWidth = GameScene.SYMBOL_WIDTH * GameScene.NUMBER_OF_REELS;
        const boardHeight = GameScene.SYMBOL_HEIGHT * GameScene.NUMBER_OF_ROWS;
        const defaultBoard = ['2', '7', '3', '4', '6', '8', '7', '3', 'K', '1', '5', '3', '4', '5', '6'];
        defaultBoard.forEach((symbol, idx) => {

            const reelId = Math.floor(idx / GameScene.NUMBER_OF_ROWS);
            const symbolId = idx % GameScene.NUMBER_OF_ROWS;

            const pos = new PIXI.Point(reelId * GameScene.SYMBOL_WIDTH - boardWidth / 2 + GameScene.SYMBOL_WIDTH / 2, symbolId * GameScene.SYMBOL_HEIGHT - boardHeight / 2);
            const symbolSpr = new PIXI.Sprite(symbolTextures[symbol]);
            symbolSpr.position = pos;
            symbolSpr.anchor.set(0.5);
            boardContainer.addChild(symbolSpr);
        });

    }

    public onUpdate (dtScalar: number) {
        const dt = dtScalar / PIXI.settings.TARGET_FPMS / 1000;
        if (this._isInitialized) {
            /**
             * Update objects in scene here using dt (delta time)
             * TODO: should call all update function of all the objects in Scene
             */
            //this._logoSprite.rotation += 0.01;
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