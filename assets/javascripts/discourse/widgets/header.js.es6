import { createWidget } from 'discourse/widgets/widget';
import { iconNode } from 'discourse/helpers/fa-icon-node';
import { avatarImg } from 'discourse/widgets/post';
import DiscourseURL from 'discourse/lib/url';
import { addExtraUserClasses } from 'discourse/helpers/user-avatar';

import { h } from 'virtual-dom';

const dropdown = {
  buildClasses(attrs) {
    if (attrs.active) { return "active"; }
  },

  click(e) {
    e.preventDefault();
    if (!this.attrs.active) {
      this.sendWidgetAction(this.attrs.action);
    }
  }
};

createWidget('header-notifications', {
  settings: {
    avatarSize: 'medium'
  },

  html(attrs) {
    const { user } = attrs;

    let avatarAttrs = {
      template: user.get('avatar_template'),
      username: user.get('username')
    };

    if (this.siteSettings.enable_names) {
      avatarAttrs.name = user.get('name');
    }

    const contents = [
      avatarImg(this.settings.avatarSize, addExtraUserClasses(user, avatarAttrs))
    ];

    const unreadNotifications = user.get('unread_notifications');
    if (!!unreadNotifications) {
      contents.push(this.attach('link', {
        action: attrs.action,
        className: 'badge-notification unread-notifications',
        rawLabel: unreadNotifications,
        omitSpan: true,
        title: "notifications.tooltip.regular",
        titleOptions: {count: unreadNotifications}
      }));
    }

    const unreadPMs = user.get('unread_private_messages');
    if (!!unreadPMs) {
      if (!user.get('read_first_notification')) {
        contents.push(h('span.ring'));
        if (!attrs.active && attrs.ringBackdrop) {
          contents.push(h('span.ring-backdrop-spotlight'));
          contents.push(h('span.ring-backdrop',
            {},
            h('h1.ring-first-notification', {} ,I18n.t('user.first_notification'))
          ));
        }
      };

      contents.push(this.attach('link', {
        action: attrs.action,
        className: 'badge-notification unread-private-messages',
        rawLabel: unreadPMs,
        omitSpan: true,
        title: "notifications.tooltip.message",
        titleOptions: {count: unreadPMs}
      }));
    }

    return contents;
  }
});


createWidget('user-dropdown', jQuery.extend({
  tagName: 'li.header-dropdown-toggle.current-user',

  buildId() {
    return 'current-user';
  },

  html(attrs) {
    return h('a.icon', { attributes: { href: attrs.user.get('path'), 'data-auto-route': true } },
             this.attach('header-notifications', attrs));
  }
}, dropdown));

createWidget('header-dropdown', jQuery.extend(dropdown, {
  tagName: 'li.header-dropdown-toggle',

  html(attrs) {
    const title = I18n.t(attrs.title);

    const body = [iconNode(attrs.icon)];
    if (attrs.contents) {
      body.push(attrs.contents.call(this));
    }

    return h('a.icon', { attributes: { href: '',
                                       'data-auto-route': true,
                                       title,
                                       'aria-label': title,
                                       id: attrs.iconId } }, body);
  }
}));

createWidget('header-icons', {
  tagName: 'ul.icons.d-header-icons.clearfix',

  buildAttributes() {
    return { role: 'navigation' };
  },

  html(attrs) {
    if (this.siteSettings.login_required && !this.currentUser) { return []; }

    const hamburger = this.attach('header-dropdown', {
                        title: 'hamburger_menu',
                        icon: 'bars',
                        iconId: 'toggle-hamburger-menu',
                        active: attrs.hamburgerVisible,
                        action: 'toggleHamburger',
                        href: '',
                        contents() {
                          if (!attrs.flagCount) { return; }
                          return h('div.badge-notification.flagged-posts', { attributes: {
                            title: I18n.t('notifications.total_flagged')
                          } }, attrs.flagCount);
                        }
                      });

    const search = this.attach('header-dropdown', {
                     title: 'search.title',
                     icon: 'search',
                     iconId: 'search-button',
                     action: 'toggleSearchMenu',
                     active: attrs.searchVisible,
                     href: Discourse.getURL('/search')
                   });

    const icons = [search, hamburger];
    if (attrs.user) {
      icons.push(this.attach('user-dropdown', {
        active: attrs.userVisible,
        action: 'toggleUserMenu',
        ringBackdrop: attrs.ringBackdrop,
        user: attrs.user
      }));
    }

    return icons;
  },
});

createWidget('sso-sign-up-btn', {
  tagName: 'button.btn-primary.btn-small.sign-up-button',

  click() {
    $.cookie("sso_event", "sign_up", {
      path: "/",
      expires: 1
    });
    this.sendWidgetAction("showLogin")
  },

  html() {
    return I18n.t("sign_up")
  }

});

createWidget('header-buttons', {
  // SP START
  tagName: 'div.header-buttons',
  // SP END

  html(attrs) {
    if (this.currentUser) { return; }

    const buttons = [];

    if (attrs.canSignUp && !attrs.topic) {
      buttons.push(this.attach('button', { label: "sign_up",
                                           className: 'btn-primary btn-small sign-up-button',
                                           action: "showCreateAccount" }));
    }

    if(this.siteSettings.enable_sso) {
      buttons.push(this.attach('sso-sign-up-btn'));
    }

    buttons.push(this.attach('button', { label: 'log_in',
                                         className: 'btn-primary btn-small login-button',
                                         action: 'showLogin',
                                         icon: 'user' }));
    return buttons;
  }
});

// SP START
createWidget('sitepoint-links', {
  tagName: 'div.header-links-wrapper.clearfix',

  html(attrs) {
    const links = [];

    links.push(h('a.header-link', {
      target: '_blank',
      href: '/?utm_source=community&utm_medium=top-nav'
    },
    'Articles'
    ));

    links.push(h('a.header-link.u-button', {
      target: '_blank',
      href: '/premium/topics/all?utm_source=community&utm_medium=top-nav'
    },
    'Premium'
    ));

    return links;
  }
});
// SP END

export default createWidget('header', {
  tagName: 'header.d-header.clearfix',
  buildKey: () => `header`,

  defaultState() {
    return { searchVisible: false,
             hamburgerVisible: false,
             userVisible: false,
             contextEnabled: false };
  },

  html(attrs, state) {
    const panels = [this.attach('header-buttons', attrs),
                    this.attach('header-icons', {
                      hamburgerVisible: state.hamburgerVisible,
                      userVisible: state.userVisible,
                      searchVisible: state.searchVisible,
                      ringBackdrop: state.ringBackdrop,
                      flagCount: attrs.flagCount,
                      user: this.currentUser }
                    )];


    if (state.searchVisible) {
      panels.push(this.attach('search-menu', { contextEnabled: state.contextEnabled }));
    } else if (state.hamburgerVisible) {
      panels.push(this.attach('hamburger-menu'));
    } else if (state.userVisible) {
      panels.push(this.attach('user-menu'));
    }

    const contents = [ this.attach('sitepoint-logo'),
                       h('div.panel.clearfix', panels) ];

    if (attrs.topic) {
      contents.push(this.attach('header-topic-info', attrs));
    } else {
      // SP START
      contents.push(this.attach('sitepoint-links'));
      //SP END
    }

    return h('div.container', h('div.contents.clearfix', contents));
  },

  updateHighlight() {
    if (!this.state.searchVisible) {
      const service = this.register.lookup('search-service:main');
      service.set('highlightTerm', '');
    }
  },

  closeAll() {
    this.state.userVisible = false;
    this.state.hamburgerVisible = false;
    this.state.searchVisible = false;
  },

  linkClickedEvent() {
    this.closeAll();
    this.updateHighlight();
  },

  toggleSearchMenu() {
    if (this.site.mobileView) {
      const searchService = this.register.lookup('search-service:main');
      const context = searchService.get('searchContext');
      var params = "";

      if (context) {
        params = `?context=${context.type}&context_id=${context.id}&skip_context=true`;
      }

      return DiscourseURL.routeTo('/search' + params);
    }

    this.state.searchVisible = !this.state.searchVisible;
    this.updateHighlight();
    Ember.run.next(() => $('#search-term').focus());
  },

  toggleUserMenu() {
    this.state.userVisible = !this.state.userVisible;
  },

  toggleHamburger() {
    this.state.hamburgerVisible = !this.state.hamburgerVisible;
  },

  togglePageSearch() {
    const { state } = this;

    if (state.searchVisible) {
      this.toggleSearchMenu();
      return false;
    }

    state.contextEnabled = false;

    const currentPath = this.register.lookup('controller:application').get('currentPath');
    const blacklist = [ /^discovery\.categories/ ];
    const whitelist = [ /^topic\./ ];
    const check = function(regex) { return !!currentPath.match(regex); };
    let showSearch = whitelist.any(check) && !blacklist.any(check);

    // If we're viewing a topic, only intercept search if there are cloaked posts
    if (showSearch && currentPath.match(/^topic\./)) {
      showSearch = ($('.topic-post .cooked, .small-action:not(.time-gap)').length <
                    this.register.lookup('controller:topic').get('model.postStream.stream.length'));
    }

    if (showSearch) {
      state.contextEnabled = true;
      this.toggleSearchMenu();
      return false;
    }

    return true;
  },

  searchMenuContextChanged(value) {
    this.state.contextEnabled = value;
  },

  domClean() {
    const { state } = this;

    if (state.searchVisible || state.hamburgerVisible || state.userVisible) {
      this.closeAll();
    }
  },

  headerKeyboardTrigger(msg) {
    switch(msg.type) {
      case 'search':
        this.toggleSearchMenu();
        break;
      case 'user':
        this.toggleUserMenu();
        break;
      case 'hamburger':
        this.toggleHamburger();
        break;
      case 'page-search':
        if (!this.togglePageSearch()) {
          msg.event.preventDefault();
          msg.event.stopPropagation();
        }
        break;
    }
  }

});
