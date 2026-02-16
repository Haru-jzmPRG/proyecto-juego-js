export class Consola {
  static clearScreen() {
    process.stdout.write("\u001b[H");
  }
}
