/**
 * snake
 * Arcade Game
 *
 * @author Aleksandr Solovey <bestua@gmail.com>
 * @copyright Aleksandr Solovey 2013
 * @version 0.8
 */

/*global define*/
(function (global, undefined) {
    "use strict";

    var document = global.document, Game;
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
    var _={random:function(a){return Math.floor(Math.random()*a+1)},sortedIndex:function(a,f){for(var b=0,c=a?a.length:b;b<c;){var d=b+c>>>1;a[d]<f?b=d+1:c=d}return b},throttle:function(a,f){function b(){g=new Date;e=null;d=a.apply(h,c)}var c,d,h,e,g=0;return function(){var j=new Date,k=f-(j-g);c=arguments;h=this;0>=k?(clearTimeout(e),e=null,g=j,d=a.apply(h,c)):e||(e=setTimeout(b,k));return d}}};
    var margin = 2.5;
    var lbound = margin;
    var rbound = 100 - margin*2;

    function is_intersect(a,b,e,f,c,d,g,h){return 0>((g-c)*(b-d)-(h-d)*(a-c))*((g-c)*(f-d)-(h-d)*(e-c))&&0>((e-a)*(d-b)-(f-b)*(c-a))*((e-a)*(h-b)-(f-b)*(g-a));}

    function Point(x,y){this.position={x:x,y:y};}

    Point.prototype.hitTest = function(obj, distance){
        distance || (distance = 16);
        var el1 = this.get('el');
        var el2 = obj.get('el');
        var w1 = getComputedStyle(el1).getPropertyValue('width') | 0;
        var h1 = getComputedStyle(el1).getPropertyValue('height') | 0;
        var w2 = getComputedStyle(el2).getPropertyValue('width') | 0;
        var h2 = getComputedStyle(el2).getPropertyValue('height') | 0;
        var x1 = el1.offsetLeft + w1/2;
        var y1 = el1.offsetTop + h1/2;
        var x2 = el2.offsetLeft + w2/2;
        var y2 = el2.offsetTop + h2/2;
        var d = (x2-x1)*(x2-x1)+(y2-y1)*(y2-y1);
        // console.log('hittest', el1, el2, w1, h1, w2, h2);
        // debugger;

        return (d < distance * distance);
    }
    Point.prototype.get = function(property){return this[property];};
    Point.prototype.set = function(property, value){ return this[property] = value;};

    function Ship(el){
        this.el = el;
        this.x = 100 / 2;
        this.width = 5.0;
        this.move();
    }

    Ship.prototype = new Point();
    Ship.prototype.move = function(shift){
        shift || (shift = 0);
        console.log('ship move');
        this.x += shift;
        if (this.x > 100) this.x=100;
        if (this.x<0) this.x=0;

        this.el.style.left = (lbound + this.x * rbound/100 - this.width/2).toFixed(2) + '%';
    };
    Ship.prototype.update = function(timeshift){
        if (typeof(this.shell) !== 'undefined'){
            this.shell.update(timeshift);
            if (this.shell.get('y') > 100){
                this.el.parentNode.removeChild(this.shell.get('el'));
                delete this.shell;
            }
        }
    };
    Ship.prototype.fire = function(){
        if (typeof(this.shell) === 'undefined'){

            this.shell = new Shell(this);
        }

    };

    function Shell(context){
        this.el = document.createElement("div");
        this.el.className = "shell";
        this.y = parseFloat(this.el.style.bottom) || 5;
        this.width = 0.25;
        this.el.style.left = (lbound + context.x*rbound/100 - this.width/2).toFixed(2) + '%';

        var ship = context.el;
        ship.parentNode.appendChild(this.el);
    }

    Shell.prototype = new Point();
    Shell.prototype.update = function(timeshift){
        //console.log('shell update', this.y);
        this.y += 1 * (timeshift/1000);
        this.el.style.bottom = this.y.toFixed(0) + '%';
    }

    function Bug(context){
        this.el = document.createElement("img");
        this.el.className = "bug";
        this.el.src = "img/bug.gif";

        context.appendChild(this.el);
    }

    Bug.prototype = new Point();

    Game = function () {

        var _game       = {},
            KEY_SPACE = 32, KEY_LEFT = 37, KEY_RIGHT = 39,
            pressed_keys = 0,
            context;

        _game = {

            active: false,

            updated: (new Date()).getTime(),

            snake: null,

            speed: 20,

            bugs: [],

            gameOver: function(){
                var record = localStorage.getItem('scores') || 0;

                if (this.scores > record){
                    alertify.alert("Game Over. You score is " + this.scores + " scores. It's a new game record!");
                    localStorage.setItem('scores', this.scores);
                }else{
                    alertify.alert("Game Over. You score is " + this.scores + " scores. The current game record - " + record + " scores.");
                }

                this.blocks.intro.style.display      = 'block';
                this.blocks.canvas.style.display     = 'none';
                this.blocks.statistics.style.display = 'none';
                this.blocks.words.style.display      = 'none';
                this.blocks.letters.style.display    = 'none';

                window.clearTimeout(window.timeout);
                music.pause();
                music.currentTime = 0;
            },

            addListeners : function () {
                var keydown, keyup, touchstart, touchmove, touchend, resize;
                var that = this;

                keydown = function(event){
                    //console.log('event keydown');
                    if (event.keyCode == KEY_SPACE) pressed_keys |= 1;
                    if (event.keyCode == KEY_LEFT) pressed_keys |= 2;
                    if (event.keyCode == KEY_RIGHT) pressed_keys |= 4;
                };

                keyup = function(event){
                    //console.log('event keyup');
                    if (event.keyCode == KEY_SPACE) pressed_keys &= ~1;
                    if (event.keyCode == KEY_LEFT) pressed_keys &= ~2;
                    if (event.keyCode == KEY_RIGHT) pressed_keys &= ~4;
                };

                touchstart = function(event){
                    //console.log('event touchstart');
                    pressed_keys = 0;
                    var middle = window.innerWidth / 2;
                    for (var i = 0; i< event.touches.length; i++){
                        if (event.touches[i].pageX < middle) pressed_keys |= 2;
                        else pressed_keys |= 4;
                    }
                };

                touchmove = function(event){
                    //console.log('event touchmove');
                    pressed_keys = 0;
                    var middle = window.innerWidth / 2;
                    for (var i = 0; i< event.touches.length; i++){
                        if (event.touches[i].pageX < middle) pressed_keys |= 2;
                        else pressed_keys |= 4;
                    }
                };

                touchend = function(event){
                    //console.log('event touchend');
                    pressed_keys = 0;
                };

                resize = function(event){
                    //console.log('resize event', arguments, window.innerWidth);
                    that.width = window.innerWidth - that.margin*2;
                    that.height = window.innerHeight -that.margin*2;
                };

                window.addEventListener("keydown", keydown, false);
                window.addEventListener("keyup", keyup, false);
                window.addEventListener("touchstart", touchstart, false);
                window.addEventListener("touchmove", touchmove, false);
                window.addEventListener("touchend", touchend, false);
                window.addEventListener("resize", resize, false);

                return resize;
            },

            blocks: {},

            handleKeys: function(timeshift) {
                if (pressed_keys&1) this.ship.fire(); //7
                if (pressed_keys&2) this.ship.move(-this.speed*timeshift/1000); //8
                if (pressed_keys&4) this.ship.move(this.speed*timeshift/1000); //9
            },

            checkHits: function(){
                var shell = this.ship.get('shell');
                if (typeof(shell) !== 'undefined'){
                    var el;
                    console.log('checkHits', this.bugs.length, shell);
                    for(var i=0; i<this.bugs.length; i++){
                        el = this.bugs[i].get('el');
                        if (shell.hitTest(this.bugs[i])){
                            if (el.style.visibility != 'hidden'){
                                console.log("HIT!");
                                el.style.visibility = 'hidden';
                                return true;
                            }
                        }
                    }
                }
                return false;

            },

            animate: function() {

                var that = this; //2

                var time = (new Date()).getTime(); //3
                var timeshift = time - this.updated; //4
                this.updated = time; //5

                this.handleKeys(timeshift); //6
                this.ship.update(timeshift);

                this.checkHits();

                requestAnimationFrame(function(){that.animate();});
            },

            reset: function(){

                this.scores = 0;
                this.renderInfo();

                pressed_keys = 0;

                this.updated = (new Date()).getTime();
            },

            start: function(){
                window.T = this;
                //console.log('start');
                if (typeof(this.init) === 'function') this.init();

                this.blocks.intro.style.display      = 'none';
                this.blocks.screen.style.display     = 'block';
                this.blocks.bugs.style.display = 'block';
                this.blocks.ship.style.display      = 'block';

                this.animate();

                // this.snake.reset();
                // this.snake.set("position", {x:this.width/4, y:this.height/2});
                // console.log(this.snake.get('position'));

                // this.reset();
                // this.active = true;
                // this.addLetter();
                // this.animate();

                // music.play();
                // playSound();
                // sound.play();

            },

            init : function () {
                console.log('init game');

                ['intro','screen','bugs','ship'].forEach(function(block){
                    this.blocks[block] = document.getElementById(block);
                }, this);

                this.addListeners()();
                this.ship = new Ship(this.blocks['ship']);

                this.bugs = [];

                for(var i=0;i<30; i++){
                    this.bugs.push(new Bug(this.blocks['bugs']));
                }

                delete this.init;
            }

        };

        return {
            start : function() { _game.start(); }
        };
    };

    global.game = new Game();

}(this));
