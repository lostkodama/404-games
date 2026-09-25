import { GRAVITY, JUMP_VELOCITY, PLAYER_GROUND_Y } from '../constants';
import type { InputState, Player } from '../types';

export function updatePlayer(player: Player, input: InputState, deltaTime: number) {
    const jumped = input.jumpPressed && player.isGrounded;

    if (jumped) {
        player.velocityY = JUMP_VELOCITY;
        player.isGrounded = false;
        console.log('Player jump action received');
    }

    player.velocityY += GRAVITY * deltaTime; // change of velocity because of acceleration (gravity x time)
    player.y += player.velocityY * deltaTime; // change of position because of velocity (velocity x time)

    // Stop at landing
    if (player.y >= PLAYER_GROUND_Y && player.velocityY >= 0) {
        player.y = PLAYER_GROUND_Y;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // update states
    if (player.isGrounded) {
        player.state = 'running';
    } else if (player.velocityY < 0) {
        player.state = 'jumping';
    } else {
        player.state = 'falling';
    }
    return jumped;
}
