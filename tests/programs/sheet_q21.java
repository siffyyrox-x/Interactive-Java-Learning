class Main {
  public static void main(String[] args) {
    int total = 1;
    for (int i = 1; i <= 3; i++) {
      for (int j = 1; j <= 2; j++) {
        total += i * j;
        System.out.print(total + " ");
      }
      System.out.println();
    }
    System.out.println(total);
  }
}
