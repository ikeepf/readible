/*
 * name: readable
 * description: 过滤新闻页面中的广告,不相关的内容
 * author: lihao
 **/
(function () {
    'use strict';
    var HEIGHT_WIN = window.innerHeight;    //浏览器窗口高度
    var PAGE_COUNT = 0, HEIGHT_DOC = 0;
    var $BODY = document.body;

    //工具方法
    var utils = {
        hasClass: function (dom, cls) {
            return dom.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)', 'ig'));
        },
        addClass: function (dom, cls) {
            if (!utils.hasClass(dom, cls))dom.className += ' ' + cls;
            return this;
        },
        removeClass: function (dom, cls) {
            if (utils.hasClass(dom, cls)) {
                var reg = new RegExp('(\\s|^)' + cls, 'ig');
                dom.className = dom.className.replace(reg, '');
            }
            return this;
        },
        //消抖函数
        debounce: function (cb, delay) {
            clearTimeout(utils.debounce.timer);
            utils.debounce.timer = setTimeout(function () {
                cb();
            }, delay || 300);
        }
    };

    //构造函数
    function Readable() {
        this.$main = document.querySelectorAll('.l-side-margins')[0] || document.body;
        this.oldPageIndex = 0;
        this.newPageIndex = null;
        this.init();
    }

    Readable.prototype = {
        //初始化
        init: function () {
            this.render();
            this.bindEvents();
        },
        render: function () {
            $BODY.style.height = 'auto';
            HEIGHT_DOC = $BODY.offsetHeight;        //文档内容高度
            PAGE_COUNT = Math.ceil(HEIGHT_DOC / HEIGHT_WIN);    //总页数
            PAGE_COUNT > 1 ? this.initPages() : null;
            $BODY.style.height = HEIGHT_WIN + 'px';
        },
        //初始化分页
        initPages: function () {
            this.$page ? this.$page.remove() : null;
            this.$page = document.createElement('div');
            this.$page.innerHTML = this.getPagesHtml();
            this.$paegItems = this.$page.querySelectorAll('a');
            utils.addClass(this.$page, 'pages-section');
            utils.addClass(this.$paegItems[this.oldPageIndex], 'active');
            $BODY.appendChild(this.$page);
            this.bindEventsPage();
        },
        //获取分页内容
        getPagesHtml: function () {
            var str = '';
            str += '<div class="panel">';
            for (var i = 1; i <= PAGE_COUNT; i++) {
                str += '<a href="javascript:;" class="item" data-page="' + (i - 1) + '">' + i + '</a>';
            }
            str += '</div>';
            return str;
        },
        //页面切换方法
        switchPage: function () {
            this.oldPageIndex = this.newPageIndex;
            this.$main.style.top = this.newPageIndex * -1 * (HEIGHT_WIN - 52) + 'px';
        },
        //事件绑定
        bindEvents: function () {
            var self = this;
            //浏览器窗口大小改变事件
            window.addEventListener('resize', function () {
                utils.debounce(function () {
                    self.init();
                }, 120);
            });
        },
        bindEventsPage: function () {
            var self = this;
            //分页点击事件
            for (var i = 0; i < this.$paegItems.length; i++) {
                this.$paegItems[i].addEventListener('click', function (e) {
                    var _$this = e.target;
                    self.newPageIndex = +_$this.getAttribute('data-page');
                    if (self.oldPageIndex != self.newPageIndex) {
                        utils.addClass(_$this, 'active');
                        utils.removeClass(self.$paegItems[self.oldPageIndex], 'active');
                        self.switchPage();
                    }
                }, false);
            }
        }
    };

    window.Readable = Readable;
    window.readable = new Readable();

}());