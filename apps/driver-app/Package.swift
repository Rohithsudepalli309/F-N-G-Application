// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "DriverApp",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(name: "DriverApp", targets: ["DriverApp"])
    ],
    dependencies: [
        .package(url: "https://github.com/socketio/socket.io-client-swift", from: "16.1.0")
    ],
    targets: [
        .target(
            name: "DriverApp",
            dependencies: [
                .product(name: "SocketIO", package: "socket.io-client-swift")
            ],
            path: "Sources"
        )
    ]
)
