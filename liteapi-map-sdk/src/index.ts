import Map from './Map';

const LiteAPI = {
  Map
};

export default LiteAPI;

// Attach to window for UMD builds
if (typeof window !== 'undefined') {
  (window as any).LiteAPI = LiteAPI;
}
