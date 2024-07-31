export interface NFT {
    id: number;
    title: string;
    tapsPerDay: number;
    tapEfficiency: string;
    price: number;
    imageUrl: string;
}

export interface UserNFTResponse {
  nft_id: number;
  name: string;
  max_energy: number;
  energy_per_tap: string;
  display_price: number;
  image_uri: string;
}

export interface NftResponse {
  nft_id: number;
  name: string;
  max_energy: number;
  energy_per_tap: string;
  display_price: number;
  image_uri: string;
}