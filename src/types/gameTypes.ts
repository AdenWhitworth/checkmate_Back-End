export type Player = {
    id: string;
    username: string;
};
  
export type Room = {
    roomId: string;
    players: Player[];
};
  