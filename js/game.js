/**
 * Space Invaders
 * Arcade Game
 *
 * @author Aleksandr Solovey <bestua@gmail.com>
 * @copyright Aleksandr Solovey 2013
 * @version 1.0

 101010101011
 101010101010
 111001010011
 */

(function (global, undefined) {
    "use strict";

    var document = global.document, Game;

    //определение кроссбраузерных  вспомогательных функций
    var requestAnimationFrame = (function () {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();
    var getBounds=function(a){for(var b=0,c=0,d=a.offsetWidth,e=a.offsetHeight;a&&!isNaN(a.offsetLeft)&&!isNaN(a.offsetTop);)b+=a.offsetLeft-a.scrollLeft,c+=a.offsetTop-a.scrollTop,a=a.offsetParent;return{x0:b,y0:c,x1:b+d,y1:c+e}};

    /** @const */var margin = 2.5; //горизонтальный отступ от краёв экрана ( впроцентах )
    /** @const */var lbound = margin; //левая граница игрового поля
    /** @const */var rbound = 100.0 - margin * 2.0; // правая граница игрового поля

    /** @const */var BUGS_COUNT = 30; //количество жуков

    /** @const */var SHIP_WIDTH = 5.0; //ширина корабля (в процентах)
    /** @const */var SHIP_SPEED = 20.0; //скорость перемещения корабля (проценты/с)
    /** @const */var SHELL_WIDTH = 0.25; //ширина снаряда (в процентах)
    /** @const */var SHELL_INITPOSITION = 5.0; //стартовая позиция снаряда

    /** @const */var BUGHILL_WIDTH = 90.0; //ширина армады
    /** @const */var BUGHILL_HSPEED = 0.5; //базовая скорость перемещения по горизонтали
    /** @const */var BUGHILL_VSPEED = 0.05; //базовая скорость приближения

    var isAudioSupport = (typeof(Audio)==='function')
    var playSound = function(id){
        if (isAudioSupport){
            var sound = document.getElementById('audio_' + id);
            sound.play();
        }
    }

    /**
     * Создает экземпляр базовой сущности DOMPoint
     *
     * @constructor
     * @this {DOMPoint}
     */
    function DOMPoint() {}

    /**
     * Определяет наличие пересечения между двумя объектами
     *
     * @param {DOMPoint} obj Объект с которым необходимо определить наличие пересечения
     * @return {bool}
     */
    DOMPoint.prototype.hitTest = function (obj) {
        var pos1 = getBounds(this.get('el'));
        var pos2 = getBounds(obj.get('el'));
        return !( pos2.x0 > pos1.x1 || pos2.x1 < pos1.x0 || pos2.y0 > pos1.y1 || pos2.y1 < pos1.y0);
    }

    /**
     * Определяет взаимное положение объектов по вертикали
     *
     * @param {DOMPoint} obj Объект с которым необходимо определить наличие пересечения
     * @return {bool}
     */
    DOMPoint.prototype.isUnder = function (obj) {
        var pos1 = getBounds(this.get('el'));
        var pos2 = getBounds(obj.get('el'));
        return (pos2.y0 > pos1.y0);
    }

    /*
     * Получает свойство объекта
     * @param {string} property
     * @return {*}
     */
    DOMPoint.prototype.get = function (property) {
        return this[property];
    };

    /*
     * Устанавливает свойство объекта
     * @param {string} property
     * @param {*} value
     */
    DOMPoint.prototype.set = function (property, value) {
        this[property] = value;
    };

    /*
     * Разрушает DOM-узел объекта
     */
    DOMPoint.prototype.destroy = function () {
        this.el.parentNode.removeChild(this.el);
    };

    /**
     * Создает экземпляр  Ship
     *
     * @constructor
     * @property {object} el DOMElement
     * @this {Ship}
     */
    function Ship(el) {
        DOMPoint.call(this);
        this.el = el;

        this.x = 100 / 2; //стартовая позиция - центр экрана

        this.width = SHIP_WIDTH;
        this.move(0); //отрисовка корабля на правильной позиции
    }

    Ship.prototype = new DOMPoint();

    /**
     * Перемещает корабль
     *
     * @property {integer} shift Смещение корабля в процентах
     */
    Ship.prototype.move = function (shift) {
        this.x += shift;
        if (this.x > 100) this.x = 100;
        if (this.x < 0) this.x = 0;

        this.el.style.left = (lbound + this.x * rbound / 100 - this.width / 2).toFixed(2) + '%';
    };

    /**
     * Обновляет состояние объекта
     *
     * @property {integer} timeshift Время с последней перерисовки, мс
     */
    Ship.prototype.update = function (timeshift) {
        if (typeof (this.shell) !== 'undefined') {
            this.shell.update(timeshift);
            if (this.shell.get('y') > 100) {
                this.shell.destroy();
                delete this.shell;
            }
        }
    };

    /**
     * Порождает снаряд
     *
     */
    Ship.prototype.fire = function () {
        if (typeof (this.shell) === 'undefined') {
            this.shell = new Shell(this);
            playSound("blaster");
        }
    };

    /**
     * Создает экземпляр Shell (снаряд)
     *
     * @constructor
     * @property {object} ship DOMElement родителя (корабля)
     * @this {Shell}
     */
    function Shell(ship) {
        DOMPoint.call(this);

        this.width = SHELL_WIDTH;
        this.y = SHELL_INITPOSITION;

        this.el = document.createElement("div");
        this.el.className = "shell";
        this.el.style.left = (lbound + ship.x * rbound / 100 - this.width / 2).toFixed(2) + '%';

        ship.get('el').parentNode.appendChild(this.el);
    }

    Shell.prototype = new DOMPoint();

    /**
     * Обновляет состояние объекта
     *
     * @property {integer} timeshift Время с последней перерисовки, мс
     */
    Shell.prototype.update = function (timeshift) {
        this.y += 100 * (timeshift / 1000);
        this.el.style.bottom = this.y.toFixed(2) + '%';
    }

    /**
     * Создает экземпляр Bughill (армада жуков)
     *
     * @constructor
     * @property {object} el DOMElement контейнер
     * @this {Bughill}
     */
    function Bughill(el){
        DOMPoint.call(this);

        this.el = el;
        this.reset();

        this.el.style.width = BUGHILL_WIDTH + '%';

        this.hSpeed = BUGHILL_HSPEED;
        this.vSpeed = BUGHILL_VSPEED;
        this.rtl = false;

        this.update(0);
        this.length = 0;
    }

    Bughill.prototype = new DOMPoint();

    /**
     * Сбрасывает состояние армады
     */
    Bughill.prototype.reset = function(){
        if (this.bugs){
            for (var i=0, bug; i < this.bugs.length; ++i){
                bug = this.bugs[i];
                bug.destroy();
            }
        }
        this.bugs = [];
        this.y = 0.0;
        this.x = 0.0;
    }

    /**
     * Обновляет состояние объекта
     *
     * @property {integer} timeshift Время с последней перерисовки, мс
     */
    Bughill.prototype.update = function(timeshift){
        this.y += this.vSpeed * timeshift / 1000.0;

        if (this.rtl){
            this.x -= this.hSpeed * timeshift / 1000.0;
        }else{
            this.x += this.hSpeed * timeshift / 1000.0;
        }

        if (this.x < 0){
            this.x = 0.0;
            this.rtl = false;
        }

        if (this.x > (100.0-BUGHILL_WIDTH)){
            this.x = 100.0 - BUGHILL_WIDTH;
            this.rtl = true;
        }


        this.el.style.top = this.y.toFixed(2) + '%';
        this.el.style.left = this.x.toFixed(2) + '%';

    }

    /**
     * Создает экземпляр Bug
     *
     * @constructor
     * @property {object} bughill DOMElement родительский контейнер
     * @this {Bug}
     */
    function Bug(bughill) {
        DOMPoint.call(this);

        this.el = document.createElement("img");
        this.el.className = "bug";
        this.el.src = "img/bug.gif";

        this.replacement = document.createElement("img");
        this.replacement.src = "img/boom.gif";

        this.active = true;

        bughill.appendChild(this.el);
    }

    Bug.prototype = new DOMPoint();

    /**
     * Взрывает жука
     *
     */
    Bug.prototype.boom = function(){
      var that = this;

      playSound("boom");

      this.el.src = this.replacement.src;
      setTimeout(function(){
        that.el.style.visibility = "hidden";
      }, 1000);
    }

    Game = function () {

        var _game = {}, pressed_keys;

        /** @const */ var KEY_SPACE = 32, KEY_LEFT = 37, KEY_RIGHT = 39;

        _game = {

            active: false,

            updated: (new Date()).getTime(),

            scores: 0,
            level: 0,
            fps: [],

            /**
             * Завершает игру
             *
             */
            gameOver: function () {
                var record;
                var localStorageAvailable = (typeof(localStorage)!=="undefined");

                if(localStorageAvailable){
                    record = localStorage.getItem('spaceinvaders-scores') || 0;
                }else{
                    record = 0;
                }

                if (this.scores > record) {
                    alertify.alert("Game Over. You score is " + this.scores + " scores. It's a new game record!");
                    if(localStorageAvailable){
                        localStorage.setItem('spaceinvaders-scores', this.scores);
                    }
                } else {
                    alertify.alert("Game Over. You score is " + this.scores + " scores. The current game record - " + record + " scores.");
                }

                this.blocks['intro'].style.display = 'block';
                this.blocks['screen'].style.display = 'none';

                this.bughill.reset();

            },

            /**
             * Кроссбраузерный обработчик событий
             * @param {object} el DOMElement
             * @param {string} event
             * @param {function} fn
             */
            bind: function (el, event, fn) {
                if (typeof el.addEventListener === "function") {
                    el.addEventListener(event, fn, false);
                } else if (el.attachEvent) {
                    el.attachEvent("on" + event, fn);
                }
            },

            /**
             * Вешает обработчики событий на клавиатуре и сенсорном экране (опционально)
             */
            addListeners: function () {
                var keydown, keyup, touchstart, touchmove, touchend, resize;
                var that = this;

                //нажатые клавиши хранятся в битах переменной pressed_keys
                keydown = function (event) {
                    if (event.keyCode == KEY_SPACE) pressed_keys |= 1;
                    if (event.keyCode == KEY_LEFT) pressed_keys |= 2;
                    if (event.keyCode == KEY_RIGHT) pressed_keys |= 4;
                };

                keyup = function (event) {
                    if (event.keyCode == KEY_SPACE) pressed_keys &= ~1;
                    if (event.keyCode == KEY_LEFT) pressed_keys &= ~2;
                    if (event.keyCode == KEY_RIGHT) pressed_keys &= ~4;
                };

                touchstart = function (event) {
                    //console.log('event touchstart');
                    pressed_keys = 0;
                    var middle = window.innerWidth / 2;
                    for (var i = 0; i < event.touches.length; i++) {
                        if (event.touches[i].pageX < middle) pressed_keys |= 2;
                        else pressed_keys |= 4;
                    }
                };

                touchmove = function (event) {
                    //console.log('event touchmove');
                    pressed_keys = 0;
                    var middle = window.innerWidth / 2;
                    for (var i = 0; i < event.touches.length; i++) {
                        if (event.touches[i].pageX < middle) pressed_keys |= 2;
                        else pressed_keys |= 4;
                    }
                };

                touchend = function (event) {
                    //console.log('event touchend');
                    pressed_keys = 0;
                };


                this.bind(document.body, "keydown", keydown);
                this.bind(document.body, "keyup", keyup);
                this.bind(window, "touchstart", touchstart);
                this.bind(window, "touchmove", touchmove);
                this.bind(window, "touchend", touchend);

                //return resize;
            },

            blocks: {},

            /**
             * Проверка нажатых клавиш
             * @param {integer} timeshift Смещение во времени с последней обработки
             */
            handleKeys: function (timeshift) {
                if (pressed_keys & 1) this.ship.fire(); //7
                if (pressed_keys & 2) this.ship.move(-SHIP_SPEED * timeshift / 1000); //8
                if (pressed_keys & 4) this.ship.move( SHIP_SPEED * timeshift / 1000); //9
            },

            /**
             * Переходит к следующему уровню
             */
            nextLevel: function(){
                this.level++;
                this.blocks.level.innerHTML = this.level;

                var bugs = [];
                this.bughill.reset();
                this.bughill.set("length", BUGS_COUNT);
                for (var i = 0; i < BUGS_COUNT; i++) {
                    bugs.push(new Bug(this.blocks['bugs']));
                }
                this.bughill.set("bugs", bugs);

                var k = Math.pow(1.5, this.level-1); //коэфициент ускорения
                this.bughill.set("hSpeed", BUGHILL_HSPEED * k);
                this.bughill.set("vSpeed", BUGHILL_VSPEED * k);

            },

            /**
             * Обработка уничтожения жука
             * @param {object} bug уничтоженный жук
             */
            addScores: function(bug){
                var len = this.bughill.get("length");
                var that = this;

                bug.set("active", false);
                bug.boom();
                len--;
                this.bughill.set("length", len);
                this.scores++;
                this.blocks.scores.innerHTML = this.scores;
                if (len == 0){
                    playSound('winner');
                    setTimeout(function() { that.nextLevel() }, 1500);
                }
            },

            /**
             * Проверка столкновений
             */
            checkHits: function () {
                var shell = this.ship.get('shell');

                //console.log('checkHits', this.bugs.length, shell);
                var bugs = this.bughill.get('bugs');
                for (var i = 0, bug, el; i < bugs.length; i++) {
                    bug = bugs[i];
                    if (bug.get('active')){
                        el = bug.get('el');
                        if (typeof (shell) !== 'undefined') {
                            if (shell.hitTest(bug)){
                              this.addScores(bug);
                              shell.destroy();
                              delete this.ship.shell;
                              return true;
                            }
                        }

                        if (this.ship.hitTest(bug) || this.ship.isUnder(bug)){
                            this.gameOver();
                        }
                    }
                }
                return false;
            },

            /**
             * Подсчет кадров/секунду
             */
            showFPS: function(timeshift){

                this.fps.push(1000.0/timeshift);
                if (this.fps.length > 100) {
                    this.fps.shift();

                    var sum = 0.0;
                    for (var i=this.fps.length-1; i>0; i--){
                        sum += this.fps[i];
                    }

                    this.blocks.fps.innerHTML = (sum/100.0).toFixed(0);
                }
            },

            /**
             * Обновление положения объектов на экране
             */
            animate: function () {

                var that = this;
                var time = (new Date()).getTime();
                var timeshift = time - this.updated;
                this.updated = time;
                this.handleKeys(timeshift);
                this.ship.update(timeshift);
                this.bughill.update(timeshift);

                this.showFPS(timeshift);

                this.checkHits();

                requestAnimationFrame(function () {
                    that.animate();
                });
            },

            /**
             * Сброс игровых переменных (перед началом новой игры)
             */
            reset: function () {
                this.scores = 0;
                this.level = 0;
                pressed_keys = 0;
                this.updated = (new Date()).getTime();
                this.bughill = new Bughill(this.blocks['bugs']);
                this.ship = new Ship(this.blocks['ship']);
                this.blocks.scores.innerHTML = this.scores;

            },

            /**
             * Начинает новую игру
             */
            start: function () {
                window.T = this;
                //console.log('start');
                if (typeof (this.init) === 'function') this.init();

                this.blocks.intro.style.display = 'none';
                this.blocks.screen.style.display = 'block';

                this.reset();
                this.nextLevel();
                this.animate();

                playSound("theme");
            },

            /**
             * Инициализирует блоки и обработчики
             */
            init: function () {
                for (var i = 0, blocks = ['intro', 'screen', 'bugs', 'ship', 'fps', 'level', 'scores'], block; i < blocks.length; ++i) {
                    block = blocks[i];
                    this.blocks[block] = document.getElementById(block);
                }
                this.addListeners();
                delete this.init;
            }

        };

        return {
            start: function () {
                _game.start();
            }
        };
    };

    global.game = new Game();

}(this));