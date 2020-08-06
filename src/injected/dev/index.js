import './index.scss';
import { addClass, removeClass } from '../../share';

class Injected {
    constructor() {
        this.$card = null;
        this.timeout = null;
        this.infoCache = {};
        this.current = null;
        this.domParser = new DOMParser();

        document.body.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onMouseMove(event) {
        const memberUrl = this.getMemberUrl(event);
        if (memberUrl) {
            this.getMemberInfo(memberUrl)
                .then((memberInfo) => {
                    this.render(event, memberUrl, memberInfo);
                })
                .catch((err) => {
                    console.warn(err);
                });
        } else if (this.$card) {
            addClass(this.$card, 'vc-hide');
        }
    }

    getMemberUrl(event) {
        const $el = event.target;
        const reg = /^\/member\//;
        if ($el.tagName === 'A' && reg.test($el.pathname || '')) {
            return $el.pathname;
        }
        if ($el.tagName === 'IMG' && $el.className === 'avatar' && $el.alt) {
            return `/member/${$el.alt}`;
        }
        return null;
    }

    getInfoFromText(text) {
        const dom = this.domParser.parseFromString(text, 'text/html');
        const $avatar = dom.querySelector('.avatar');
        const $summary = dom.querySelector('#Main .box .gray');
        const name = $avatar.alt;
        const avatar = $avatar.src;
        const online = !!dom.querySelector('#Main .box .online');
        const joinRank = $summary.textContent.match(/\s(\d+)\s/)[1];
        const joinTime = $summary.textContent.match(/\s(\d{4}-.*\+08:00)/)[1];
        const $activity = $summary.querySelector('a');
        const activityRank = $activity ? $activity.textContent : '';
        const $socials = [...dom.querySelectorAll('#Main .box .widgets a')];
        const socials = $socials.map(($item) => {
            const $img = $item.querySelector('img');
            return {
                href: $item.href,
                img: $img ? $img.src : '',
                name: $item.textContent.trim(),
            };
        });
        const lock = !!dom.querySelector('#Main .box .topic_content');
        const $topic = [...dom.querySelectorAll('#Main .box .topic-link')];
        const topics = $topic.map(($item) => {
            return {
                href: $item.href,
                title: $item.textContent.trim(),
            };
        });
        return {
            name,
            avatar,
            online,
            lock,
            joinRank,
            joinTime,
            activityRank,
            socials,
            topics,
        };
    }

    getMemberInfo(memberUrl) {
        if (this.infoCache[memberUrl]) {
            return Promise.resolve(this.infoCache[memberUrl]);
        }

        clearTimeout(this.timeout);
        return new Promise((resolve) => {
            this.timeout = setTimeout(() => {
                fetch(memberUrl)
                    .then((res) => res.text())
                    .then((text) => {
                        this.infoCache[memberUrl] = this.getInfoFromText(text);
                        resolve(this.infoCache[memberUrl]);
                    });
            }, 500);
        });
    }

    getPosFromEvent(event) {
        const $el = event.target;
        const { clientWidth } = this.$card;
        const { x, y, width, height } = $el.getBoundingClientRect();
        const left = x + width - clientWidth / 2 - width / 2;
        const top = y + height + 10;
        return {
            left,
            top,
        };
    }

    render(event, memberUrl, memberInfo) {
        if (!this.$card) {
            this.$card = document.createElement('div');
            this.$card.className = 'v2ex-card';
            document.body.appendChild(this.$card);
        }
        removeClass(this.$card, 'vc-hide');
        const { left, top } = this.getPosFromEvent(event);
        this.$card.style.left = `${left}px`;
        this.$card.style.top = `${top}px`;
        if (memberUrl === this.current) return;
        this.current = memberUrl;
        console.log(memberInfo);
    }
}

export default new Injected();