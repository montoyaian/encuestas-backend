import { ProfileEnum } from 'src/users/entities/profileEnum';

export interface Payload {
  sub: number;
  profile: ProfileEnum;
}
