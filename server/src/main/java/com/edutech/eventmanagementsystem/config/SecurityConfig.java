
package com.edutech.eventmanagementsystem.config;

import com.edutech.eventmanagementsystem.jwt.JwtRequestFilter;
import com.edutech.eventmanagementsystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userService).passwordEncoder(passwordEncoder);
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/user/register", "/api/user/login").permitAll()
            .antMatchers("/api/planner/**").hasAuthority("PLANNER")
            .antMatchers("/api/staff/**").hasAuthority("STAFF")
            .antMatchers("/api/client/**").hasAuthority("CLIENT")
            .anyRequest().authenticated()
            .and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
    }
}


// // old securityconfig:
 

// package com.edutech.eventmanagementsystem.config;
 
// import com.edutech.eventmanagementsystem.jwt.JwtRequestFilter;
// import com.edutech.eventmanagementsystem.service.UserService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
// import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
 
// @Configuration
// @EnableWebSecurity
// public class SecurityConfig extends WebSecurityConfigurerAdapter {
 
//     @Autowired
//     private UserService userService;
 
//     @Autowired
//     private JwtRequestFilter jwtRequestFilter;
 
//     @Override
//     protected void configure(AuthenticationManagerBuilder auth) throws Exception {
//         auth.userDetailsService(userService).passwordEncoder(passwordEncoder());
//     }
 
//     @Bean
//     public PasswordEncoder passwordEncoder() {
//         return new BCryptPasswordEncoder();
//     }
 
//     @Bean
//     @Override
//     public AuthenticationManager authenticationManagerBean() throws Exception {
//         return super.authenticationManagerBean();
//     }
 
//     @Override
//     protected void configure(HttpSecurity http) throws Exception {
//         http.csrf().disable()
//             .authorizeRequests()
//             .antMatchers("/api/user/register", "/api/user/login").permitAll()
//             .antMatchers("/api/planner/**").hasAuthority("PLANNER")
//             .antMatchers("/api/staff/**").hasAuthority("STAFF")
//             .antMatchers("/api/client/**").hasAuthority("CLIENT")
//             .anyRequest().authenticated()
//             .and()
//             .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);
 
//         http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
//     }
// }