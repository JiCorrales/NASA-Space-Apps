using UnityEngine;
using UnityEngine.InputSystem;

namespace SpaceApps.Ship
{
    /// <summary>
    /// Keyboard-and-mouse player: WASD or arrows to move, hold the right mouse button to look,
    /// left click uses screens through the EventSystem. The cursor stays free, which behaves in WebGL.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public sealed class DesktopRig : MonoBehaviour
    {
        public Transform head;
        public float moveSpeed = 2.5f;
        [Tooltip("Degrees per pixel of mouse movement while the right button is held.")]
        public float mouseLookSpeed = 0.2f;
        [Tooltip("Degrees per second for Q/E turning.")]
        public float keyTurnSpeed = 90f;

        CharacterController body;
        float pitch;
        float fallSpeed;

        void Awake() => body = GetComponent<CharacterController>();

        void Update()
        {
            var keys = Keyboard.current;
            if (keys != null)
            {
                var input = new Vector2(
                    Axis(keys.dKey.isPressed || keys.rightArrowKey.isPressed, keys.aKey.isPressed || keys.leftArrowKey.isPressed),
                    Axis(keys.wKey.isPressed || keys.upArrowKey.isPressed, keys.sKey.isPressed || keys.downArrowKey.isPressed));
                Move(input, Time.deltaTime);
                float turn = Axis(keys.eKey.isPressed, keys.qKey.isPressed);
                if (turn != 0f) Look(new Vector2(turn * keyTurnSpeed * Time.deltaTime, 0f));
            }

            var mouse = Mouse.current;
            if (mouse != null && mouse.rightButton.isPressed)
                Look(mouse.delta.ReadValue() * mouseLookSpeed);
        }

        static float Axis(bool positive, bool negative) => (positive ? 1f : 0f) - (negative ? 1f : 0f);

        /// <summary>Walk with a stick-style input (x = strafe, y = forward) for dt seconds.</summary>
        public void Move(Vector2 input, float dt)
        {
            var velocity = Vector3.ClampMagnitude(transform.right * input.x + transform.forward * input.y, 1f) * moveSpeed;
            fallSpeed = body.isGrounded ? -1f : fallSpeed - 9.81f * dt;
            velocity.y = fallSpeed;
            body.Move(velocity * dt);
        }

        /// <summary>Turn by (yaw, pitch) degrees.</summary>
        public void Look(Vector2 degrees)
        {
            transform.Rotate(0f, degrees.x, 0f);
            pitch = Mathf.Clamp(pitch - degrees.y, -80f, 80f);
            head.localEulerAngles = new Vector3(pitch, 0f, 0f);
        }
    }
}
