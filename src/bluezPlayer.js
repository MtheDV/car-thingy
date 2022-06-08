const dbus = require('dbus-next');
const bus = dbus.systemBus();
const Variant = dbus.Variant;

// bus.addMethodHandler((msg) => {
//   console.log(msg);
//   if (
//     msg.path === '/org/bluez' &&
//     msg.interface === 'org.bluez.Agent1' &&
//     msg.member === 'RequestConfirmation'
//   ) {
//     console.info('RequestConfirmation returns');
//     return true;
//   }
// });
//
// bus.addMethodHandler((msg) => {
//   console.log(msg);
//   if (
//     msg.path === '/org/bluez' &&
//     msg.interface === 'org.bluez.Agent1' &&
//     msg.member === 'AuthorizeService'
//   ) {
//     console.info('AuthorizeService returns');
//     return true;
//   }
// });

// bus.on('message', (msg) => {
//   console.log('got a message: ', msg);
// });

class BluezPlayer {
  player;
  device;
  alias;
  adapter;
  agent;
  
  constructor(player, device, alias, adapter, agent, propertyChangeActions) {
    this.player = player;
    this.device = device;
    this.alias = alias;
    this.adapter = adapter;
    this.agent = agent;
    
    // Call each property action to update display
    Object.values(propertyChangeActions).forEach((action) => action());
    
    // Play now that it's connected
    this.play();
    
    /**
     * Listen for property changes, then run provided actions.
     * Actions Available: https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/media-api.txt
     */
    // this.#properties.on('PropertiesChanged', (iface, changed) => {
    //   for (let prop of Object.keys(changed)) {
    //     console.log(`Player Property changed: ${prop}`);
    //     propertyChangeActions[prop]();
    //   }
    // });
    
    /**
     * Listen for adapter changes, the run actions.
     * Actions Available: https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/adapter-api.txt
     */
    this.#adapterProperties.on('PropertiesChanged', (iface, changed) => {
      for (let prop of Object.keys(changed)) {
        console.log(`Adapter Property changed: ${prop}`);
      }
    });
  }
  
  static async initialize(propertyChangeActions) {
    // Connect to the bluez dbus, then get the objects it manages
    const bluezObj = await bus.getProxyObject('org.bluez', '/');
    const manager = bluezObj.getInterface('org.freedesktop.DBus.ObjectManager');
    const managedObjects = await manager.GetManagedObjects();
    
    // Check if there is already a media player device within the managed objects
    let playerPath = null;
    let player = null;
    let adapterPath = null;
    let adapter = null;
    Object.entries(managedObjects).forEach(([path, managedObject]) => {
      if ('org.bluez.MediaPlayer1' in managedObject) {
        playerPath = path;
      }
      if ('org.bluez.Adapter1' in managedObject) {
        adapterPath = path;
      }
    });
  
    let agent = null;
    if (adapterPath) {
      adapter = await bus.getProxyObject('org.bluez', adapterPath);
      // const agentInterface = agent.getInterface('org.bluez.Agent1');
      // console.log(agentInterface);
    } else {
      throw Error('Unable to connect to bluetooth adapter!');
    }
    
    // Get media device if found, otherwise search or wait for connected device
    let devicePath = null;
    let device = null;
    let alias = 'Unknown Bluetooth Device';
    if (playerPath) {
      player = await bus.getProxyObject('org.bluez', playerPath);
      devicePath = await player.getInterface('org.freedesktop.DBus.Properties').Get('org.bluez.MediaPlayer1', 'Device');
      device = await bus.getProxyObject('org.bluez', devicePath.value);
      alias = (await device.getInterface('org.freedesktop.DBus.Properties').Get('org.bluez.Device1', 'Alias')).value;
    } else {
      // TODO: Wait for device and/or search for new device
      const manager = await bus.getProxyObject('org.bluez', '/org/bluez');
      const managerInterface = manager.getInterface('org.bluez.AgentManager1');
      console.log(managerInterface);
      managerInterface.RegisterAgent('/bluezplayer/agent', 'NoInputNoOutput');
      managerInterface.RequestDefaultAgent('/bluezplayer/agent');
      console.log(managerInterface);
      console.log('BluezPlayer is a default agent');
      const adapterProperties = adapter.getInterface('org.freedesktop.DBus.Properties');
      await adapterProperties.Set('org.bluez.Adapter1', 'Discoverable', new Variant('b', true));
  
      agent = await bus.getProxyObject('org.bluez', '/bluezplayer/agent');
      console.log(agent);
  
      this.#adapterProperties.on('PropertiesChanged', (iface, changed) => {
        for (let prop of Object.keys(changed)) {
          console.log(`Adapter Property changed: ${prop}`);
        }
      });
    }
    
    return new BluezPlayer(player, device, alias, adapter, agent, propertyChangeActions);
  }
  
  get #interface() {
    return this.player.getInterface('org.bluez.MediaPlayer1');
  }
  
  get #properties() {
    return this.player.getInterface('org.freedesktop.DBus.Properties');
  }
  
  get #adapterProperties() {
    return this.adapter.getInterface('org.freedesktop.DBus.Properties');
  }
  
  async getTrack() {
    const trackVariant = await this.#properties.Get('org.bluez.MediaPlayer1', 'Track');
    return Object.entries(trackVariant.value).reduce((prev, [type, variant]) => {
      prev[type] = variant.value;
      return prev;
    }, {});
  }
  
  async getStatus() {
    const statusVariant = await this.#properties.Get('org.bluez.MediaPlayer1', 'Status');
    return statusVariant.value;
  }
  
  async getPosition() {
    const positionVariant = await this.#properties.Get('org.bluez.MediaPlayer1', 'Position');
    return positionVariant.value;
  }
  
  pause() {
    if (!this.player) return;
    this.#interface.Pause();
  }
  
  play() {
    if (!this.player) return;
    this.#interface.Play();
  }
  
  next() {
    if (!this.player) return;
    this.#interface.Next();
  }
  
  previous() {
    if (!this.player) return;
    this.#interface.Previous();
  }
}

module.exports = BluezPlayer;