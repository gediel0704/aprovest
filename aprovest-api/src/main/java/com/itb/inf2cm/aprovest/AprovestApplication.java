package com.itb.inf2cm.aprovest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * AproVest - API REST da plataforma de preparação para vestibulares.
 * <p>
 * @EnableAsync      : permite processar a correção de redação por IA em segundo plano.
 * @EnableScheduling : tarefas automáticas (notificações diárias, bolsa mensal, expiração do Pro).
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class AprovestApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(AprovestApplication.class);
		// Na primeira execução, cria o banco aprovestdb com os scripts da pasta /database
		app.addListeners(new com.itb.inf2cm.aprovest.config.CriadorBanco());
		app.run(args);
	}

}
