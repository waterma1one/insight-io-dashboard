#!/usr/bin/env python3
"""Minimal robot simulator for the Insight.IO dashboard.

Publishes /odom (nav_msgs/Odometry) and /battery_state (sensor_msgs/BatteryState) and
subscribes to /cmd_vel (geometry_msgs/Twist).

/auto_drive (std_msgs/Bool) is latched: while true the robot loops along layout.json's
waypoints (AUTO); while false it integrates /cmd_vel instead (the dashboard sends zeros when
paused). A /cmd_vel older than CMD_TIMEOUT counts as zero, so a stalled dashboard stops the
robot rather than leaving it driving. Leaving manual rejoins the route at the nearest point.
"""
import json
import math
import os

import rclpy
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from rclpy.node import Node
from sensor_msgs.msg import BatteryState
from std_msgs.msg import Bool

RATE_HZ = 30.0
AUTO_SPEED = 1.2  # m/s along the waypoint loop
CMD_TIMEOUT = 0.5  # s without /cmd_vel before the command counts as zero
DRAIN_PER_SEC = 0.05  # battery % lost per second of motion


class SimRobot(Node):
    def __init__(self):
        super().__init__("sim_robot")
        with open(os.environ.get("LAYOUT", "/data/layout.json")) as f:
            layout = json.load(f)
        self.waypoints = layout["waypoints"]
        self.bounds = layout["bounds"]
        self.seg = [
            math.dist(p, self.waypoints[(i + 1) % len(self.waypoints)])
            for i, p in enumerate(self.waypoints)
        ]
        self.total = sum(self.seg)
        if self.total <= 0:
            raise ValueError('layout.json waypoints must span a non-zero distance')
        self.dist = 0.0
        self.battery = 100.0
        self.x, self.y = self.waypoints[0]
        self.heading = 0.0
        self.cmd = Twist()
        self.cmd_at = -1e9
        self.auto = True  # latched from /auto_drive; true so the sim also runs standalone

        self.odom_pub = self.create_publisher(Odometry, "odom", 10)
        self.battery_pub = self.create_publisher(BatteryState, "battery_state", 10)
        self.create_subscription(Twist, "cmd_vel", self.on_cmd, 10)
        self.create_subscription(Bool, "auto_drive", self.on_auto, 10)
        self.last = self.now()
        self.create_timer(1.0 / RATE_HZ, self.tick)

    def now(self):
        return self.get_clock().now().nanoseconds / 1e9

    def on_cmd(self, msg):
        self.cmd = msg
        self.cmd_at = self.now()

    def on_auto(self, msg):
        if msg.data and not self.auto:
            self.rejoin_route()
        self.auto = msg.data

    def tick(self):
        now = self.now()
        dt, self.last = now - self.last, now
        if self.auto:
            self.follow_route(dt)
        else:
            self.drive(dt, fresh=now - self.cmd_at < CMD_TIMEOUT)
        self.publish()

    def drive(self, dt, fresh):
        linear = self.cmd.linear.x if fresh else 0.0
        angular = self.cmd.angular.z if fresh else 0.0
        self.heading += angular * dt
        self.x = min(self.bounds["maxX"], max(self.bounds["minX"], self.x + math.cos(self.heading) * linear * dt))
        self.y = min(self.bounds["maxY"], max(self.bounds["minY"], self.y + math.sin(self.heading) * linear * dt))
        if linear:
            self.battery = max(0.0, self.battery - DRAIN_PER_SEC * dt)

    def rejoin_route(self):
        """Continue the loop from the route point nearest to where manual driving ended."""
        best, run = math.inf, 0.0
        for i, length in enumerate(self.seg):
            a, b = self.waypoints[i], self.waypoints[(i + 1) % len(self.waypoints)]
            t = 0.0
            if length:
                t = ((self.x - a[0]) * (b[0] - a[0]) + (self.y - a[1]) * (b[1] - a[1])) / (length * length)
                t = min(1.0, max(0.0, t))
            d = math.hypot(a[0] + (b[0] - a[0]) * t - self.x, a[1] + (b[1] - a[1]) * t - self.y)
            if d < best:
                best, self.dist = d, run + t * length
            run += length

    def follow_route(self, dt):
        self.dist = (self.dist + AUTO_SPEED * dt) % self.total
        d = self.dist
        last = len(self.seg) - 1
        for i, length in enumerate(self.seg):
            if d <= length or i == last:
                a, b = self.waypoints[i], self.waypoints[(i + 1) % len(self.waypoints)]
                t = d / length if length else 0.0
                self.x, self.y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
                self.heading = math.atan2(b[1] - a[1], b[0] - a[0])
                break
            d -= length
        self.battery = max(0.0, self.battery - DRAIN_PER_SEC * dt)

    def publish(self):
        stamp = self.get_clock().now().to_msg()
        odom = Odometry()
        odom.header.stamp = stamp
        odom.header.frame_id = "map"
        odom.child_frame_id = "base_link"
        odom.pose.pose.position.x = self.x
        odom.pose.pose.position.y = self.y
        odom.pose.pose.orientation.z = math.sin(self.heading / 2)
        odom.pose.pose.orientation.w = math.cos(self.heading / 2)
        self.odom_pub.publish(odom)

        bat = BatteryState()
        bat.header.stamp = stamp
        bat.percentage = self.battery / 100.0  # BatteryState uses 0..1
        self.battery_pub.publish(bat)


def main():
    rclpy.init()
    rclpy.spin(SimRobot())


if __name__ == "__main__":
    main()
