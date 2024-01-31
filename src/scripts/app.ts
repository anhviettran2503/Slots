import * as PIXI from 'pixi.js';
import { GameScene } from './GameScene';
import Server from './Server';

export class MainApp {
    public static inst: MainApp;

    public app: PIXI.Application;
    /**
     * code entry point, it is triggered by the window.onload event found at the bottom of this class
     */
    public constructor () {
        MainApp.inst = this;

        console.log('MainApp constructor');
        const canvas = <HTMLCanvasElement> document.getElementById('GameCanvas');
        this.app = new PIXI.Application({
            backgroundColor: 0xefe1de,
            width: 720,
            height: 960,
            view: canvas
        });
        document.body.appendChild(this.app.view);

        this.app.stage.addChild(new GameScene(new Server()));
    }
}


/**
 * on the window event create the MainApp class
 * some people like to add this into a seperate .js file
 */
window.onload = function () {
    new MainApp();
};