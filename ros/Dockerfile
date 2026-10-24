FROM ros:humble-ros-base
RUN apt-get update \
    && apt-get install -y --no-install-recommends ros-humble-rosbridge-server \
    && rm -rf /var/lib/apt/lists/*
COPY sim_robot/sim_robot.py /opt/sim_robot.py
