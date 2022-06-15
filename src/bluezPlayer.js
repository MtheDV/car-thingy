const dbus = require('dbus-next');
const bus = dbus.systemBus();
const Variant = dbus.Variant;
const Message = dbus.Message;

class BluezAgent {
  adapter;
  
  constructor(adapter, onConnected) {
    this.adapter = adapter;
    
    /**
     * Add custom method handler for RequestConfirmation and AuthorizeService
     * to auto pair when a device requests itself to connect.
     */
    bus.addMethodHandler(async (msg) => {
      if (
        msg.path === '/bluezplayer/agent' &&
        msg.interface === 'org.bluez.Agent1'
      ) {
        if (msg.member === 'RequestConfirmation') {
          console.info('[AGENT] RequestConfirmation returns');
          
          // Get the connecting device and set it as trusted
          const [devicePath, _] = msg.body;
          const device = await bus.getProxyObject('org.bluez', devicePath);
          const deviceProperties = device.getInterface('org.freedesktop.DBus.Properties');
          deviceProperties.Set('org.bluez.Device1', 'Trusted', new Variant('b', true));
          
          // Listen for device connected property change, then call onConnected function
          deviceProperties.on('PropertiesChanged', (iface, changed) => {
            for (let prop of Object.keys(changed)) {
              console.log(`[AGENT] Connecting Device Property changed: ${prop}`);
              if (prop === 'Connected' && changed[prop].value === true) {
                // Stop discovering and run connected function
                this.closeDiscovery().then(() => {
                  onConnected();
                  deviceProperties.removeAllListeners('PropertiesChanged');
                }).catch();
              }
            }
          });
          
          // Send an empty return message to notify the bluetooth device to confirm connection
          const returnMessage = Message.newMethodReturn(msg, 's', ['']);
          bus.send(returnMessage);
          return true;
        }
        
        if (msg.member === 'AuthorizeService') {
          console.info('[AGENT] AuthorizeService returns');
          
          // Send an empty return message to notify the bluetooth device to authorize connection
          const returnMessage = Message.newMethodReturn(msg, 's', ['']);
          bus.send(returnMessage);
          return true;
        }
      }
    });
  }
  
  static async initialize(adapterAlias, onConnected) {
    // Connect to the bluez dbus, then get the objects it manages
    const bluezObj = await bus.getProxyObject('org.bluez', '/');
    const manager = bluezObj.getInterface('org.freedesktop.DBus.ObjectManager');
    const managedObjects = await manager.GetManagedObjects();
    
    // Get the bluetooth adapter to control when the device can be discovered
    let adapterPath = null;
    let adapter = null;
    Object.entries(managedObjects).forEach(([path, managedObject]) => {
      if ('org.bluez.Adapter1' in managedObject) {
        adapterPath = path;
      }
    });
    
    if (adapterPath) {
      adapter = await bus.getProxyObject('org.bluez', adapterPath);
      await adapter.getInterface('org.freedesktop.DBus.Properties').Set('org.bluez.Adapter1', 'Alias', new Variant('s', adapterAlias));
      const manager = await bus.getProxyObject('org.bluez', '/org/bluez');
      const managerInterface = manager.getInterface('org.bluez.AgentManager1');
      managerInterface.RegisterAgent('/bluezplayer/agent', 'DisplayOnly');
      managerInterface.RequestDefaultAgent('/bluezplayer/agent');
    } else {
      throw Error('Unable to connect to bluetooth adapter!');
    }
    
    return new BluezAgent(adapter, onConnected);
  }
  
  get #adapterProperties() {
    return this.adapter.getInterface('org.freedesktop.DBus.Properties');
  }
  
  async openDiscovery() {
    console.info('[AGENT] Opening discoverable');
    await this.#adapterProperties.Set('org.bluez.Adapter1', 'Discoverable', new Variant('b', true));
    
    // Find bluetooth devices, then attempt to pair to the device
    const bluezObj = await bus.getProxyObject('org.bluez', '/');
    const manager = bluezObj.getInterface('org.freedesktop.DBus.ObjectManager');
    const managedObjects = await manager.GetManagedObjects();
  
    console.info(managedObjects);
  
    // Check if there is already a media player device within the managed objects
    let playerPath;
    Object.entries(managedObjects).forEach(([path, managedObject]) => {
      if ('org.bluez.MediaPlayer1' in managedObject) {
        playerPath = path;
      }
    });
  
    // Get device and pair with it
    if (playerPath) {
      const player = await bus.getProxyObject('org.bluez', playerPath);
      const devicePath = await player.getInterface('org.freedesktop.DBus.Properties').Get('org.bluez.MediaPlayer1', 'Device');
      const device = await bus.getProxyObject('org.bluez', devicePath.value);
      console.info(device);
      device.getInterface('org.bluez.Device1').Pair();
    }
  }
  
  async closeDiscovery() {
    console.info('[AGENT] Closing discoverable');
    await this.#adapterProperties.Set('org.bluez.Adapter1', 'Discoverable', new Variant('b', false));
  }
}

class BluezPlayer {
  player;
  device;
  alias;
  deviceListener;
  
  constructor(player, device, alias, playerPropertyChangeActions, devicePropertyChangeActions) {
    this.player = player;
    this.device = device;
    this.alias = alias;
    
    /**
     * Listen for property changes, then run provided actions.
     * Actions Available: https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/media-api.txt
     */
    this.#playerProperties.on('PropertiesChanged', (iface, changed) => {
      for (let prop of Object.keys(changed)) {
        console.log(`[PLAYER] Player Property changed: ${prop}`);
        playerPropertyChangeActions[prop]();
      }
    });
    
    /**
     * Listen for property changes, then run provided actions.
     * Actions Available: https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/device-api.txt
     */
    this.#deviceProperties.on('PropertiesChanged', (iface, changed) => {
      for (let prop of Object.keys(changed)) {
        console.log(`[PLAYER] Device Property changed: ${prop}`);
        devicePropertyChangeActions[prop]();
      }
    });
  
    /**
     * Create listener to watch for device property changes every X seconds
     */
    this.deviceListener = setInterval(() => {
      Object.values(devicePropertyChangeActions).forEach((func) => {
        func();
      });
    }, 3000);
  }
  
  static async initialize(playerPropertyChangeActions, devicePropertyChangeActions) {
    // Connect to the bluez dbus, then get the objects it manages
    const bluezObj = await bus.getProxyObject('org.bluez', '/');
    const manager = bluezObj.getInterface('org.freedesktop.DBus.ObjectManager');
    const managedObjects = await manager.GetManagedObjects();
    
    // Check if there is already a media player device within the managed objects
    let playerPath;
    let player;
    Object.entries(managedObjects).forEach(([path, managedObject]) => {
      if ('org.bluez.MediaPlayer1' in managedObject) {
        playerPath = path;
      }
    });
    
    // Get media device if found, otherwise throw error to notify that a device should be connected
    let devicePath;
    let device;
    let alias;
    if (playerPath) {
      player = await bus.getProxyObject('org.bluez', playerPath);
      devicePath = await player.getInterface('org.freedesktop.DBus.Properties').Get('org.bluez.MediaPlayer1', 'Device');
      device = await bus.getProxyObject('org.bluez', devicePath.value);
      alias = (await device.getInterface('org.freedesktop.DBus.Properties').Get('org.bluez.Device1', 'Alias')).value;
    } else {
      throw Error('No bluetooth device found!');
    }
    
    return new BluezPlayer(player, device, alias, playerPropertyChangeActions, devicePropertyChangeActions);
  }
  
  cleanUp() {
    this.#playerProperties.removeAllListeners('PropertiesChanged');
    this.#deviceProperties.removeAllListeners('PropertiesChanged');
    clearInterval(this.deviceListener);
  }
  
  get #playerInterface() {
    return this.player.getInterface('org.bluez.MediaPlayer1');
  }
  
  get #playerProperties() {
    return this.player.getInterface('org.freedesktop.DBus.Properties');
  }
  
  get #deviceProperties() {
    return this.device.getInterface('org.freedesktop.DBus.Properties');
  }
  
  async getTrack() {
    const trackVariant = await this.#playerProperties.Get('org.bluez.MediaPlayer1', 'Track');
    return Object.entries(trackVariant.value).reduce((prev, [type, variant]) => {
      prev[type] = variant.value;
      return prev;
    }, {});
  }
  
  async getStatus() {
    const statusVariant = await this.#playerProperties.Get('org.bluez.MediaPlayer1', 'Status');
    return statusVariant.value;
  }
  
  async getPosition() {
    const positionVariant = await this.#playerProperties.Get('org.bluez.MediaPlayer1', 'Position');
    return positionVariant.value;
  }
  
  async isConnected() {
    const connectedVariant = await this.#deviceProperties.Get('org.bluez.Device1', 'Connected');
    return connectedVariant.value;
  }
  
  pause() {
    if (!this.player) return;
    this.#playerInterface.Pause();
  }
  
  play() {
    if (!this.player) return;
    this.#playerInterface.Play();
  }
  
  next() {
    if (!this.player) return;
    this.#playerInterface.Next();
  }
  
  previous() {
    if (!this.player) return;
    this.#playerInterface.Previous();
  }
}

module.exports = {BluezAgent, BluezPlayer};