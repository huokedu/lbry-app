import React from 'react';
import lbryuri from '../lbryuri.js';
import {Link} from './link.js';
import {Icon, CreditAmount} from './common.js';

var Header = React.createClass({
  _balanceSubscribeId: null,
  _isMounted: false,

  propTypes: {
    onSearch: React.PropTypes.func.isRequired,
    onSubmit: React.PropTypes.func.isRequired
  },

  getInitialState: function() {
    return {
      balance: 0
    };
  },
  componentDidMount: function() {
    this._isMounted = true;
    this._balanceSubscribeId = lbry.balanceSubscribe((balance) => {
      if (this._isMounted) {
        this.setState({balance: balance});
      }
    });
  },
  componentWillUnmount: function() {
    this._isMounted = false;
    if (this._balanceSubscribeId) {
      lbry.balanceUnsubscribe(this._balanceSubscribeId)
    }
  },
  render: function() {
    return <header id="header">
        <div className="header__item">
          <Link onClick={() => { lbry.back() }} button="alt button--flat" icon="icon-arrow-left" />
        </div>
        <div className="header__item">
          <Link href="?discover" button="alt button--flat" icon="icon-home" />
        </div>
        <div className="header__item header__item--wunderbar">
          <WunderBar address={this.props.address} icon={this.props.wunderBarIcon}
                     onSearch={this.props.onSearch} onSubmit={this.props.onSubmit} viewingPage={this.props.viewingPage} />
        </div>
        <div className="header__item">
          <Link href="?wallet" button="text" icon="icon-bank" label={lbry.formatCredits(this.state.balance, 1)} ></Link>
        </div>
        <div className="header__item">
          <Link button="primary button--flat" href="?publish" icon="icon-upload" label="Publish" />
        </div>
        <div className="header__item">
          <Link button="alt button--flat" href="?downloaded" icon="icon-folder" />
        </div>
        <div className="header__item">
          <Link button="alt button--flat" href="?settings" icon="icon-gear" />
        </div>
      </header>
  }
});

class WunderBar extends React.PureComponent {
  static propTypes = {
    onSearch: React.PropTypes.func.isRequired,
    onSubmit: React.PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    this._userTypingTimer = null;
    this._input = null;
    this._stateBeforeSearch = null;
    this._resetOnNextBlur = true;
    this.onChange = this.onChange.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onReceiveRef = this.onReceiveRef.bind(this);
    this.state = {
      address: this.props.address,
      icon: this.props.icon
    };
  }

  componentWillUnmount() {
    if (this.userTypingTimer) {
      clearTimeout(this._userTypingTimer);
    }
  }

  onChange(event) {

    if (this._userTypingTimer)
    {
      clearTimeout(this._userTypingTimer);
    }

    this.setState({ address: event.target.value })

    let searchTerm = event.target.value;

    this._userTypingTimer = setTimeout(() => {
      this._resetOnNextBlur = false;
      this.props.onSearch(searchTerm);
    }, 800); // 800ms delay, tweak for faster/slower
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.viewingPage !== this.props.viewingPage || nextProps.address != this.props.address) {
      this.setState({ address: nextProps.address, icon: nextProps.icon });
    }
  }

  onFocus() {
    this._stateBeforeSearch = this.state;
    let newState = {
      icon: "icon-search",
      isActive: true
    }

    this._focusPending = true;
    //below is hacking, improved when we have proper routing
    if (!this.state.address.startsWith('lbry://') && this.state.icon !== "icon-search") //onFocus, if they are not on an exact URL or a search page, clear the bar
    {
      newState.address = '';
    }
    this.setState(newState);
  }

  onBlur() {
    let commonState = {isActive: false};
    if (this._resetOnNextBlur) {
      this.setState(Object.assign({}, this._stateBeforeSearch, commonState));
      this._input.value = this.state.address;
    } else {
      this._resetOnNextBlur = true;
      this._stateBeforeSearch = this.state;
      this.setState(commonState);
    }
  }

  componentDidUpdate() {
    this._input.value = this.state.address;
    if (this._input && this._focusPending) {
      this._input.select();
      this._focusPending = false;
    }
  }

  onKeyPress(event) {
    if (event.charCode == 13 && this._input.value) {

      let uri = null,
          method = "onSubmit";

      this._resetOnNextBlur = false;
      clearTimeout(this._userTypingTimer);

      try {
        uri = lbryuri.normalize(this._input.value);
        this.setState({ value: uri });
      } catch (error) { //then it's not a valid URL, so let's search
        uri = this._input.value;
        method = "onSearch";
      }

      this.props[method](uri);
      this._input.blur();
    }
  }

  onReceiveRef(ref) {
    this._input = ref;
  }

  render() {
    return (
      <div className={'wunderbar' + (this.state.isActive ? ' wunderbar--active' : '')}>
        {this.state.icon ? <Icon fixed icon={this.state.icon} /> : '' }
        <input className="wunderbar__input" type="search" placeholder="Type a LBRY address or search term"
               ref={this.onReceiveRef}
               onFocus={this.onFocus}
               onBlur={this.onBlur}
               onChange={this.onChange}
               onKeyPress={this.onKeyPress}
               value={this.state.address}
               placeholder="Find movies, music, games, and more" />
      </div>
    );
  }
}

export let SubHeader =  React.createClass({
  render: function() {
    let links = [],
        viewingUrl = '?' + this.props.viewingPage;

    for (let link of Object.keys(this.props.links)) {
      links.push(
        <a href={link} key={link} className={ viewingUrl == link ? 'sub-header-selected' : 'sub-header-unselected' }>
          {this.props.links[link]}
        </a>
      );
    }
    return (
      <nav className={'sub-header' + (this.props.modifier ? ' sub-header--' + this.props.modifier : '')}>
        {links}
      </nav>
    );
  }
});

export default Header;
