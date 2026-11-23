-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: orso_tenis
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `availability_exceptions`
--

DROP TABLE IF EXISTS `availability_exceptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `availability_exceptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exception_date` date NOT NULL,
  `court_id` int DEFAULT NULL,
  `exception_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slot_start` time DEFAULT NULL,
  `slot_end` time DEFAULT NULL,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_exception_court` (`court_id`),
  KEY `fk_exception_created_by` (`created_by`),
  CONSTRAINT `fk_exception_court` FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`),
  CONSTRAINT `fk_exception_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `availability_exceptions`
--

LOCK TABLES `availability_exceptions` WRITE;
/*!40000 ALTER TABLE `availability_exceptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `availability_exceptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `court_schedules`
--

DROP TABLE IF EXISTS `court_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `court_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `day_of_week` tinyint NOT NULL,
  `slot_start` time NOT NULL,
  `slot_end` time NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `court_schedules`
--

LOCK TABLES `court_schedules` WRITE;
/*!40000 ALTER TABLE `court_schedules` DISABLE KEYS */;
INSERT INTO `court_schedules` VALUES (1,6,'11:00:00','12:00:00',1,'2026-11-14 00:30:46'),(2,6,'12:00:00','13:00:00',1,'2026-11-14 00:30:46'),(3,6,'13:00:00','14:00:00',1,'2026-11-14 00:30:46'),(4,6,'14:00:00','15:00:00',1,'2026-11-14 00:30:46'),(5,6,'17:00:00','18:00:00',1,'2026-11-14 00:30:46'),(6,6,'18:00:00','19:00:00',1,'2026-11-14 00:30:46'),(7,7,'10:00:00','11:00:00',1,'2026-11-14 00:31:00'),(8,7,'11:00:00','12:00:00',1,'2026-11-14 00:31:00'),(9,7,'12:00:00','13:00:00',1,'2026-11-14 00:31:00'),(10,7,'13:00:00','14:00:00',1,'2026-11-14 00:31:00');
/*!40000 ALTER TABLE `court_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courts`
--

DROP TABLE IF EXISTS `courts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `surface` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `disabled_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disabled_at` datetime DEFAULT NULL,
  `disabled_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `fk_court_disabled_by` (`disabled_by`),
  CONSTRAINT `fk_court_disabled_by` FOREIGN KEY (`disabled_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courts`
--

LOCK TABLES `courts` WRITE;
/*!40000 ALTER TABLE `courts` DISABLE KEYS */;
INSERT INTO `courts` VALUES (1,'Cancha 1','Polvo de ladrillo',1,'2026-11-11 18:29:06',NULL,NULL,NULL),(2,'Cancha 2','Polvo de ladrillo',1,'2026-11-11 18:29:06',NULL,NULL,NULL),(3,'Cancha 3','Polvo de ladrillo',1,'2026-11-11 18:29:06',NULL,NULL,NULL),(4,'Cancha 4','Polvo de ladrillo',1,'2026-11-11 18:29:06',NULL,NULL,NULL);
/*!40000 ALTER TABLE `courts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `players` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_student` tinyint(1) DEFAULT NULL,
  `category` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` mediumtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `players_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `players`
--

LOCK TABLES `players` WRITE;
/*!40000 ALTER TABLE `players` DISABLE KEYS */;
INSERT INTO `players` VALUES (1,2,'Juan','Perez','3511234567','2026-11-11 18:36:51',1,'Avanzado',NULL),(10,7,'lucas','Perez','3512447725','2026-11-23 16:38:16',NULL,NULL,NULL);
/*!40000 ALTER TABLE `players` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_rules`
--

DROP TABLE IF EXISTS `pricing_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uses_lights` tinyint(1) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_rules`
--

LOCK TABLES `pricing_rules` WRITE;
/*!40000 ALTER TABLE `pricing_rules` DISABLE KEYS */;
INSERT INTO `pricing_rules` VALUES (1,'non_student',0,15000.00,1,'2026-11-14 15:04:33'),(2,'non_student',1,20000.00,1,'2026-11-14 15:04:33');
/*!40000 ALTER TABLE `pricing_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_prices`
--

DROP TABLE IF EXISTS `reservation_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_prices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_without_lights` decimal(10,2) NOT NULL,
  `student_with_lights` decimal(10,2) NOT NULL,
  `non_student_without_lights` decimal(10,2) NOT NULL,
  `non_student_with_lights` decimal(10,2) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `reservation_prices_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_prices`
--

LOCK TABLES `reservation_prices` WRITE;
/*!40000 ALTER TABLE `reservation_prices` DISABLE KEYS */;
INSERT INTO `reservation_prices` VALUES (1,15000.00,18000.00,18000.00,21000.00,'2026-11-19 15:19:08',NULL);
/*!40000 ALTER TABLE `reservation_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player_id` int NOT NULL,
  `court_id` int NOT NULL,
  `created_by` int NOT NULL,
  `cancelled_by` int DEFAULT NULL,
  `reservation_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'confirmed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `uses_lights` tinyint(1) NOT NULL DEFAULT '0',
  `price_applied` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_reservation_player` (`player_id`),
  KEY `fk_reservation_court` (`court_id`),
  KEY `fk_reservation_created_by` (`created_by`),
  KEY `fk_reservation_cancelled_by` (`cancelled_by`),
  CONSTRAINT `fk_reservation_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_reservation_court` FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`),
  CONSTRAINT `fk_reservation_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_reservation_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (16,1,1,2,NULL,'2026-11-29','11:00:00','12:00:00','confirmed','2026-11-23 16:36:13',1,18000.00);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('player','staff','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@orsotenis.com','scrypt$aba83b15f3677631884ca2dd75be3632$a91f518d0d1d9b6ea838430249d1bfd0f6e27fef38c917e4eb6efe72f566d38842ea1d2e58c95383f51e237cc8361b5a3609b303c5cd35cce7455a18f685fd97','admin',1,'2026-11-11 18:35:37',NULL,NULL,NULL),(2,'juan@gmail.com','scrypt$0262d4e6ebf6f826abd12f95e982fa5e$11b734f116f4f5655e868d65daf401decfddb3dc038938fb05b0ed4e51d6dd6c764c3d31d55efcc20e71029a375c2058e1dfd94d16ae4f0304f9d2a3706a086a','player',1,'2026-11-11 18:36:41',NULL,NULL,NULL),(7,'lucas@gmail.com','scrypt$e12d15671c61e87ea0f9af7e63c482f8$d963de9701382dfc243419c7a57f84404f15f0f4b72ee57fb9b0a2bb3d291068c37a5aedf847bef2b3333ee0d016e6f174e0fd982d2d41003add1a940472c846','player',1,'2026-11-23 16:38:16','lucas','Perez','3512447725');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'orso_tenis'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-23 13:44:59
