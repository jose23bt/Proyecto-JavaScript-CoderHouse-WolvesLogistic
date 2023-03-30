﻿//VIAJES PARTICULARES CON MAPA

// CARACTERISTICAS DEL MAPA
const myLatLng = { lat: -34.6148108, lng: -58.502316 };
const mapOptions = {
    center: myLatLng,
    zoom: 11,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

// EL MAPA
const map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);

// Crear un objeto DirectionsService para usar el método de ruta y obtener un resultado para nuestra solicitud
const directionsService = new google.maps.DirectionsService();

// Crear un objeto DirectionsRenderer que usaremos para mostrar la ruta
const directionsDisplay = new google.maps.DirectionsRenderer();

// Vincular DirectionsRenderer al mapa
directionsDisplay.setMap(map);

// Definir función calcRoute
function calcRoute() {
    // Crear solicitud
    const request = {
        origin: document.getElementById("from").value,
        destination: document.getElementById("to").value,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
    };

    // Pasar la solicitud al método de ruta
    directionsService.route(request, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            // Obtener distancia y tiempo
            const output = document.querySelector('#output');
            const fare = calculateFare_km(result.routes[0].legs[0].distance.value);
            output.innerHTML = "<div class='alert-info'>Origen: " + document.getElementById("from").value + ".<br />Destino: " + document.getElementById("to").value + ".<br /> distancia del recorrido <i class='fas fa-road'></i> : " + result.routes[0].legs[0].distance.text + ".<br />Duración <i class='fas fa-hourglass-start'></i> : " + result.routes[0].legs[0].duration.text + ".<br /> Tarifa $ : " + fare + ".</div>"
            // Mostrar la ruta
            directionsDisplay.setDirections(result);
        }
        else {
            // Eliminar la ruta del mapa
            directionsDisplay.setDirections({ routes: [] });
            // Centrar el mapa en buenos aires
            map.setCenter(myLatLng);

            // Mostrar mensaje de error
            output.innerHTML = "<div class='alert-danger'><i class='fas fa-exclamation-triangle'></i> No se pudo recuperar la distancia del viaje.</div>";
        }
    });
}

// Crear objetos de autocompletado para todas las entradas
const options = {
    types: ['(cities)']
};

const input1 = document.getElementById("from");
const autocomplete1 = new google.maps.places.Autocomplete(input1, options);

const input2 = document.getElementById("to");
const autocomplete2 = new google.maps.places.Autocomplete(input2, options);

function calculateFare_km(kilometros) {
    const fare = (kilometros * 0.100).toFixed(2);
    return fare;
}


//COTIZADOR POR ZONAS

// Obtener los botones
const botonesAgregar = document.querySelectorAll('.agregar');
const botonesEliminar = document.querySelectorAll('.eliminar');

// Obtener el carrito desde el almacenamiento local (si existe)
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Actualizar el carrito en el almacenamiento local
function actualizarCarrito() {
    const carritoUL = document.querySelector('.carrito ul');
    carritoUL.innerHTML = '';
    let total = 0;
    const productosAgregados = {};

    carrito.forEach(producto => {
        const nombreProducto = producto.nombre;
        const precioProducto = parseFloat(producto.precio);
        total += precioProducto;

        // Agregar el producto al objeto productosAgregados y contar cuántas veces se ha agregado
        if (nombreProducto in productosAgregados) {
            productosAgregados[nombreProducto]++;
        } else {
            productosAgregados[nombreProducto] = 1;
        }
    });

    for (const nombreProducto in productosAgregados) {
        const cantidad = productosAgregados[nombreProducto];
        const li = document.createElement('li');
        li.innerHTML = `${nombreProducto} x${cantidad} <span>$${(cantidad * parseFloat(carrito.find(item => item.nombre === nombreProducto).precio)).toFixed(2)}</span>`;
        carritoUL.appendChild(li);
    }

    document.querySelector('.total').innerHTML = `Total: $${total.toFixed(2)}`;
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Agregar un producto al carrito
function agregarProducto(evento) {
    // Obtener el nombre y el precio del producto
    const producto = evento.target.dataset.producto;
    const precio = evento.target.parentNode.querySelector('.precio').textContent.replace('$', '');
    // Agregar el producto al carrito
    carrito.push({ nombre: producto, precio: precio });

    // Actualizar el carrito en la página y en el almacenamiento local
    actualizarCarrito();
}

// Eliminar un producto del carrito
function eliminarProducto(evento) {
    // Obtener el nombre del producto
    const producto = evento.target.dataset.producto;

    // Buscar y eliminar el producto del carrito
    carrito = carrito.filter(item => item.nombre !== producto);

    // Actualizar el carrito en la página y en el almacenamiento local
    actualizarCarrito();
}

// Agregar eventos a los botones de agregar y eliminar
botonesAgregar.forEach(boton => boton.addEventListener('click', agregarProducto));
botonesEliminar.forEach(boton => boton.addEventListener('click', eliminarProducto));

// Mostrar el carrito al cargar la página
actualizarCarrito();

function solicitarViaje() {
    // Obtener los productos agrupados por nombre y sumar las cantidades
    const productosAgrupados = carrito.reduce((acumulador, producto) => {
        if (!acumulador[producto.nombre]) {
            acumulador[producto.nombre] = {
                nombre: producto.nombre,
                precio: parseFloat(producto.precio),
                cantidad: 1
            };
        } else {
            acumulador[producto.nombre].precio += parseFloat(producto.precio);
            acumulador[producto.nombre].cantidad++;
        }
        return acumulador;
    }, {});

    // Crear una cadena de consulta URL-encoded con los productos y sus cantidades
    const queryString = Object.values(productosAgrupados)
        .map(producto => `${encodeURIComponent(producto.nombre)} x${producto.cantidad}=${encodeURIComponent(producto.precio)}`)
        .join('%0A');

    // Obtener el precio total
    const total = Object.values(productosAgrupados)
        .reduce((acumulador, producto) => acumulador + producto.precio, 0);

    // Crear el mensaje con los productos y el precio total
    const mensaje = `¡Hola! Quiero solicitar un viaje con los siguientes productos:%0A%0A${queryString}%0A%0ATotal: $${total.toFixed(2)}`;

    // Crear la URL de la conversación de WhatsApp con el mensaje
    const url = `https://api.whatsapp.com/send/?phone=5491123318355&text=${mensaje}`;

    // Abrir la conversación de WhatsApp en una pestaña nueva
    window.open(url, '_blank');
}

 //REINICIAR COTIZADOR

 const botonReiniciar = document.querySelector('.reiniciar');

function reiniciarCotizador() {
    carrito = [];
    actualizarCarrito();
}

botonReiniciar.addEventListener('click', reiniciarCotizador);

console.log(producto)