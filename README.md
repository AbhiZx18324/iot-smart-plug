# IoT-Based Smart Plug for Appliance Recognition & Power Monitoring

## Project Overview
This project implements an IoT-based smart plug system that identifies connected appliances and monitors their power consumption. The system uses electrical signatures derived from voltage and current measurements to classify appliances and analyze energy usage.

To simplify deployment and demonstrations, the project uses a **software-defined virtual smart plug** that emulates real electrical sensors while preserving realistic interfaces and data behavior.

---

## Key Features
- Virtual smart plug simulating voltage & current sensors
- Real-time data streaming using MQTT
- Centralized backend for data ingestion and storage
- Machine learning-based appliance classification
- Anomaly detection based on device-specific behavior
- Web dashboard for live and historical visualization
- Digital twin for system simulation and monitoring

---

## System Architecture (High-Level)
```
graph TD
    A[Virtual Smart Plug] -->|MQTT| B[Data Ingestion Backend]
    B --> C[(Time-Series Database)]
    B --> D[(Metadata Database)]
    B --> E[Machine Learning Pipeline]
    E --> F[Web Dashboard]
```
---

## Team & Responsibilities

### Data Engineering, Analytics & ML
- **Abhirup Adhikary**
- **Ayanak Misra**

Responsibilities:
- Virtual sensor simulation
- MQTT data streaming
- Backend ingestion & storage
- Feature extraction
- Appliance classification
- Anomaly detection

### Digital Twin
- **Pratyush Kumar Chaturvedi**

Responsibilities:
- Digital twin modeling of the smart plug
- Simulation & system state monitoring
- Fault and anomaly injection

### Application Development
- **Satyam Jha**
- **Saurik Saha**

Responsibilities:
- Web-based dashboard
- Live data visualization
- Historical analytics display
- User interface & interaction

---

## Tech Stack (Proposed)
- **Language:** Python
- **Messaging:** MQTT (Mosquitto)
- **Backend:** Python services
- **Databases:** Time-series DB / SQL
- **ML:** Scikit-learn (initial), optional deep learning
- **Dashboard:** Web-based (TBD)

---

## Project Motivation
By breaking down electricity consumption by appliance, users can:
- Identify energy-intensive devices
- Detect abnormal appliance behavior
- Optimize electricity usage and reduce costs

---

## Notes
- The virtual smart plug is designed to closely mirror real hardware sensors.
- The system architecture allows seamless replacement with physical sensors in the future.